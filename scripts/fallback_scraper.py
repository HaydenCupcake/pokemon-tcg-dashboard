from __future__ import annotations

import asyncio
import importlib
import json
import os
import re
import sys
from copy import deepcopy
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from statistics import median
from typing import Any
from urllib.parse import quote_plus

try:
    _crawl4ai = importlib.import_module("crawl4ai")
    AsyncWebCrawler = _crawl4ai.AsyncWebCrawler
    BrowserConfig = _crawl4ai.BrowserConfig
    CacheMode = _crawl4ai.CacheMode
    CrawlerRunConfig = _crawl4ai.CrawlerRunConfig
    JsonCssExtractionStrategy = _crawl4ai.JsonCssExtractionStrategy
except ImportError:  # pragma: no cover - intentionally lazy for unit tests / bootstrap state
    AsyncWebCrawler = None
    BrowserConfig = None
    CacheMode = None
    CrawlerRunConfig = None
    JsonCssExtractionStrategy = None


ROOT_DIR = Path(__file__).resolve().parents[1]
DEFAULT_SEED_PATH = ROOT_DIR / "src" / "data" / "mockPricingData.json"
DEFAULT_OUTPUT_PATH = ROOT_DIR / "src" / "data" / "realPricingData.json"
MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
GRADE_LABELS = {"psa8": "PSA 8", "psa9": "PSA 9", "psa10": "PSA 10"}
CARD_QUERY_OVERRIDES = {
    "Illustrator Pikachu": "Pikachu Illustrator Pokemon promo",
    "1st Edition Base Set Charizard": "Charizard 1st Edition Base Set Pokemon",
    "Umbreon VMAX Alternate Art (Moonbreon)": "Umbreon VMAX 215 Evolving Skies alternate art Moonbreon Pokemon",
    "Mario Pikachu Full Art": "Mario Pikachu 294/XY-P full art Pokemon",
    "Shining Charizard 1st Edition": "Shining Charizard 1st Edition Neo Destiny Pokemon",
}
DEFAULT_HEADERS = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
}
SCROLL_JS = """
window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
await new Promise(resolve => setTimeout(resolve, 1200));
window.scrollTo({ top: 0, behavior: 'instant' });
await new Promise(resolve => setTimeout(resolve, 500));
"""


@dataclass(slots=True)
class SaleRecord:
    title: str
    price: int
    sale_date: str
    platform: str
    grade_key: str
    url: str = ""


class Crawl4AIUnavailableError(RuntimeError):
    pass


class MarketplaceScraper:
    platform_name = "marketplace"

    def build_query(self, card_name: str, grade_label: str) -> str:
        base_name = CARD_QUERY_OVERRIDES.get(card_name, card_name)
        return f"{base_name} {grade_label}".strip()

    def build_search_url(self, query: str) -> str:
        raise NotImplementedError

    def schema(self) -> dict[str, Any]:
        raise NotImplementedError

    def wait_for(self) -> str | None:
        return None

    def run_config(self) -> Any:
        if CrawlerRunConfig is None or JsonCssExtractionStrategy is None or CacheMode is None:
            raise Crawl4AIUnavailableError(
                "crawl4ai is not installed. Create scripts/.venv, install crawl4ai + playwright, and run playwright install."
            )
        return CrawlerRunConfig(
            cache_mode=CacheMode.BYPASS,
            extraction_strategy=JsonCssExtractionStrategy(self.schema(), verbose=False),
            js_code=SCROLL_JS,
            wait_for=self.wait_for(),
            wait_until="domcontentloaded",
            page_timeout=90000,
            delay_before_return_html=1.2,
            scan_full_page=True,
            scroll_delay=0.4,
            word_count_threshold=1,
            verbose=False,
        )

    def normalize_items(self, items: list[dict[str, Any]], grade_key: str) -> list[SaleRecord]:
        records: list[SaleRecord] = []
        for item in items:
            title = compact_whitespace(item.get("title") or item.get("listing_text") or "")
            price = parse_price(item.get("price") or item.get("listing_text") or "")
            sale_date = parse_sale_date(item.get("sale_date") or item.get("listing_text") or "")
            url = item.get("url") or ""
            if title and price and sale_date:
                records.append(
                    SaleRecord(
                        title=title,
                        price=price,
                        sale_date=sale_date,
                        platform=self.platform_name,
                        grade_key=grade_key,
                        url=url,
                    )
                )
        return dedupe_sales(records)

    async def scrape(self, crawler: Any, card_name: str, grade_key: str) -> list[SaleRecord]:
        grade_label = GRADE_LABELS[grade_key]
        query = self.build_query(card_name, grade_label)
        url = self.build_search_url(query)
        print(f"    [{self.platform_name}] {url}")
        result = await crawler.arun(url=url, config=self.run_config())
        if not getattr(result, "success", False):
            message = getattr(result, "error_message", "unknown crawl error")
            print(f"    [{self.platform_name}] crawl failed: {message}")
            return []
        raw_items = parse_json_like(getattr(result, "extracted_content", "[]"), default=[])
        if not isinstance(raw_items, list):
            raw_items = []
        return self.normalize_items(raw_items, grade_key)


class EbayScraper(MarketplaceScraper):
    platform_name = "eBay"

    def build_search_url(self, query: str) -> str:
        return f"https://www.ebay.com/sch/i.html?_nkw={quote_plus(query)}&LH_Complete=1&LH_Sold=1&rt=nc"

    def wait_for(self) -> str | None:
        return "css:li.s-item, css:main"

    def schema(self) -> dict[str, Any]:
        return {
            "name": "eBay sold listings",
            "baseSelector": "li.s-item",
            "fields": [
                {"name": "title", "selector": ".s-item__title", "type": "text"},
                {"name": "price", "selector": ".s-item__price", "type": "text"},
                {"name": "sale_date", "selector": ".POSITIVE, .s-item__caption--signal, .s-item__title--tagblock", "type": "text"},
                {"name": "url", "selector": "a.s-item__link", "type": "attribute", "attribute": "href"},
                {"name": "listing_text", "selector": ".s-item__info", "type": "text"},
            ],
        }


class GoldinScraper(MarketplaceScraper):
    platform_name = "Goldin"

    def build_search_url(self, query: str) -> str:
        return f"https://goldin.co/results?search={quote_plus(query)}"

    def wait_for(self) -> str | None:
        return "css:input[placeholder='Search Auctions'], css:input[placeholder='Search all lots and listings'], css:main"

    def schema(self) -> dict[str, Any]:
        return {
            "name": "Goldin result listings",
            "baseSelector": "a[href*='/item/'], a[href*='/lot/'], a[href*='/auction/'], a[href*='/private-sales/']",
            "fields": [
                {"name": "title", "selector": "h1, h2, h3, h4, p, span", "type": "text"},
                {"name": "price", "selector": "[data-testid*='price'], [class*='price'], strong, span", "type": "text"},
                {"name": "sale_date", "selector": "time, [data-testid*='date'], [class*='date'], span", "type": "text"},
                {"name": "url", "selector": ":scope", "type": "attribute", "attribute": "href"},
                {"name": "listing_text", "selector": ":scope", "type": "text"},
            ],
        }


class FanaticsCollectScraper(MarketplaceScraper):
    platform_name = "Fanatics Collect"

    def build_search_url(self, query: str) -> str:
        return f"https://sales-history.fanaticscollect.com/?title={quote_plus(query)}"

    def wait_for(self) -> str | None:
        return "css:div.custom-1e7iano, css:[class*='custom-1e7'], css:main"

    def schema(self) -> dict[str, Any]:
        return {
            "name": "Fanatics sold items",
            "baseSelector": "div.custom-1e7iano, div[class*='custom-1e7']",
            "fields": [
                {"name": "title", "selector": "p.custom-6x540c, p[class*='custom-6x5'], p[class*='chakra-text']", "type": "text"},
                {"name": "price", "selector": "p.custom-n1lm4a, p[class*='custom-n1l']", "type": "text"},
                {"name": "sale_date", "selector": "div.custom-gm9bxx p.custom-1lvke15, div[class*='custom-gm9'] p[class*='custom-1lv']", "type": "text"},
                {"name": "url", "selector": "a.custom-z8q1yu, a[class*='custom-z8q']", "type": "attribute", "attribute": "href"},
                {"name": "listing_text", "selector": ":scope", "type": "text"},
            ],
        }


def parse_json_like(value: Any, default: Any) -> Any:
    if value is None:
        return default
    if isinstance(value, (list, dict)):
        return value
    try:
        return json.loads(value)
    except Exception:
        return default


def compact_whitespace(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def parse_price(value: Any) -> int | None:
    match = re.search(r"\$\s*([0-9][0-9,]*(?:\.\d{1,2})?)", str(value or ""))
    if not match:
        return None
    number = float(match.group(1).replace(",", ""))
    return int(round(number)) if number > 0 else None


def parse_sale_date(value: Any) -> str | None:
    text = compact_whitespace(value)
    patterns = [
        r"Sold on ([A-Z][a-z]{2} \d{1,2}, \d{4})",
        r"([A-Z][a-z]{2} \d{1,2}, \d{4})",
        r"(\d{4}-\d{2}-\d{2})",
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if not match:
            continue
        raw = match.group(1)
        for fmt in ("%b %d, %Y", "%Y-%m-%d"):
            try:
                return datetime.strptime(raw, fmt).strftime("%Y-%m-%d")
            except ValueError:
                continue
    return None


def normalize_card_name(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def dedupe_sales(records: list[SaleRecord]) -> list[SaleRecord]:
    seen: set[tuple[str, int, str, str]] = set()
    unique: list[SaleRecord] = []
    for record in records:
        key = (normalize_card_name(record.title), record.price, record.sale_date, record.platform)
        if key in seen:
            continue
        seen.add(key)
        unique.append(record)
    return unique


def ensure_monotonic(values: dict[str, int]) -> dict[str, int]:
    psa8 = max(1, int(round(values["psa8"])))
    psa9 = max(psa8, int(round(values["psa9"])))
    psa10 = max(psa9, int(round(values["psa10"])))
    return {"psa8": psa8, "psa9": psa9, "psa10": psa10}


def percent_delta(current: int, previous: int | None) -> float:
    if not previous:
        return 0.0
    return round(((current - previous) / previous) * 100, 1)


def direction_from_delta(delta: float) -> str:
    return "up" if delta >= 0 else "down"


def iso_month_key(iso_date: str) -> str:
    return iso_date[:7]


def month_index(iso_date: str) -> tuple[int, int]:
    dt = datetime.strptime(iso_date, "%Y-%m-%d")
    return dt.year, dt.month


def generate_baseline_history(current_prices: dict[str, int]) -> list[dict[str, Any]]:
    now = datetime.utcnow()
    history: list[dict[str, Any]] = []
    for offset in range(11, -1, -1):
        month = now.month - offset
        year = now.year
        while month <= 0:
            month += 12
            year -= 1
        progress = (11 - offset) / 11 if 11 else 1
        row = {}
        for grade, current in current_prices.items():
            start = current * 0.74
            row[grade] = max(1, int(round(start + ((current - start) * progress))))
        row = ensure_monotonic(row)
        history.append(
            {
                "month": MONTH_NAMES[month - 1],
                "date": f"{year}-{month:02d}-15",
                **row,
            }
        )
    history[-1].update(current_prices)
    return history


def sales_medians_by_month(sales: list[SaleRecord]) -> dict[str, int]:
    grouped: dict[str, list[int]] = {}
    for sale in sales:
        grouped.setdefault(iso_month_key(sale.sale_date), []).append(sale.price)
    return {month: int(round(median(values))) for month, values in grouped.items() if values}


def compute_grade_price(sales: list[SaleRecord], fallback_value: int) -> int:
    if not sales:
        return fallback_value
    ordered = sorted(sales, key=lambda item: (item.sale_date, item.price), reverse=True)
    sample = [sale.price for sale in ordered[:5]]
    return int(round(median(sample))) if sample else fallback_value


def build_output_card(seed_card: dict[str, Any], baseline_card: dict[str, Any], sales_by_grade: dict[str, list[SaleRecord]]) -> dict[str, Any]:
    baseline_history = deepcopy(baseline_card.get("history") or [])
    baseline_prices = {
        grade: int(baseline_card["currentPrices"][grade]["value"])
        for grade in GRADE_LABELS
    }
    current_values = {
        grade: compute_grade_price(sales_by_grade.get(grade, []), baseline_prices[grade])
        for grade in GRADE_LABELS
    }
    current_values = ensure_monotonic(current_values)

    history = baseline_history if baseline_history else generate_baseline_history(current_values)
    if len(history) < 12:
        history = generate_baseline_history(current_values)

    month_maps = {grade: sales_medians_by_month(sales_by_grade.get(grade, [])) for grade in GRADE_LABELS}
    patched_history: list[dict[str, Any]] = []
    for row in history[-12:]:
        cloned = deepcopy(row)
        month_key = iso_month_key(cloned["date"])
        for grade in GRADE_LABELS:
            if month_key in month_maps[grade]:
                cloned[grade] = month_maps[grade][month_key]
        grades = ensure_monotonic({grade: cloned[grade] for grade in GRADE_LABELS})
        cloned.update(grades)
        patched_history.append(cloned)

    patched_history[-1].update(current_values)
    previous_row = patched_history[-2] if len(patched_history) > 1 else patched_history[-1]
    current_prices = {}
    for grade in GRADE_LABELS:
        value = current_values[grade]
        previous_value = previous_row.get(grade, value)
        delta = percent_delta(value, previous_value)
        current_prices[grade] = {
            "value": value,
            "trend30d": delta,
            "direction": direction_from_delta(delta),
        }

    return {
        "cardId": seed_card["cardId"],
        "name": seed_card["name"],
        "set": seed_card["set"],
        "theme": seed_card.get("theme"),
        "releaseYear": seed_card["releaseYear"],
        "artist": seed_card["artist"],
        "rank": seed_card["rank"],
        "rarity": seed_card["rarity"],
        "imageUrls": seed_card["imageUrls"],
        "currentPrices": current_prices,
        "history": patched_history,
    }


def load_cards(path: Path) -> list[dict[str, Any]]:
    return json.loads(path.read_text(encoding="utf-8"))


def save_cards(path: Path, cards: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(cards, indent=2) + "\n", encoding="utf-8")


def build_browser_config() -> Any:
    if BrowserConfig is None:
        raise Crawl4AIUnavailableError(
            "crawl4ai is not installed. Create scripts/.venv, install crawl4ai + playwright, and run playwright install."
        )
    return BrowserConfig(
        browser_type="chromium",
        headless=True,
        verbose=False,
        viewport_width=1440,
        viewport_height=2200,
        user_agent_mode="random",
        headers=DEFAULT_HEADERS,
        enable_stealth=True,
        light_mode=True,
        extra_args=[
            "--disable-blink-features=AutomationControlled",
            "--no-sandbox",
            "--disable-dev-shm-usage",
        ],
    )


async def scrape_card(crawler: Any, seed_card: dict[str, Any], baseline_card: dict[str, Any], scrapers: list[MarketplaceScraper]) -> dict[str, Any]:
    print(f"Processing {seed_card['name']}")
    sales_by_grade: dict[str, list[SaleRecord]] = {grade: [] for grade in GRADE_LABELS}
    for grade in GRADE_LABELS:
        results = await asyncio.gather(*(scraper.scrape(crawler, seed_card["name"], grade) for scraper in scrapers))
        flattened = [sale for result in results for sale in result]
        sales_by_grade[grade] = flattened
        print(f"  {grade}: {len(flattened)} sale(s)")
    return build_output_card(seed_card, baseline_card, sales_by_grade)


async def run(seed_path: Path = DEFAULT_SEED_PATH, output_path: Path = DEFAULT_OUTPUT_PATH) -> list[dict[str, Any]]:
    if AsyncWebCrawler is None:
        raise Crawl4AIUnavailableError(
            "crawl4ai is not installed. Create scripts/.venv, install crawl4ai + playwright, and run playwright install."
        )
    seed_cards = load_cards(seed_path)
    baseline_cards = load_cards(output_path) if output_path.exists() else seed_cards
    baseline_by_name = {card["name"]: card for card in baseline_cards}
    browser_config = build_browser_config()
    scrapers: list[MarketplaceScraper] = [EbayScraper(), GoldinScraper(), FanaticsCollectScraper()]

    async with AsyncWebCrawler(config=browser_config) as crawler:
        results = []
        for seed_card in seed_cards:
            baseline = baseline_by_name.get(seed_card["name"], seed_card)
            results.append(await scrape_card(crawler, seed_card, baseline, scrapers))

    save_cards(output_path, results)
    print(f"Fallback scraper wrote {len(results)} cards to {output_path}")
    return results


def parse_args(argv: list[str]) -> tuple[Path, Path]:
    seed_path = DEFAULT_SEED_PATH
    output_path = DEFAULT_OUTPUT_PATH
    args = list(argv)
    while args:
        token = args.pop(0)
        if token == "--seed" and args:
            seed_path = Path(args.pop(0)).resolve()
        elif token == "--output" and args:
            output_path = Path(args.pop(0)).resolve()
    return seed_path, output_path


def main(argv: list[str] | None = None) -> int:
    argv = argv if argv is not None else sys.argv[1:]
    seed_path, output_path = parse_args(argv)
    try:
        asyncio.run(run(seed_path=seed_path, output_path=output_path))
        return 0
    except Crawl4AIUnavailableError as error:
        print(str(error), file=sys.stderr)
        return 2
    except Exception as error:  # pragma: no cover - exercised via CLI integration
        print(f"fallback_scraper failed: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
