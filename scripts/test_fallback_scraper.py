import importlib.util
import pathlib
import sys
import unittest

MODULE_PATH = pathlib.Path(__file__).with_name('fallback_scraper.py')
spec = importlib.util.spec_from_file_location('fallback_scraper', MODULE_PATH)
if spec is None or spec.loader is None:
    raise RuntimeError(f'Unable to load {MODULE_PATH}')
mod = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = mod
spec.loader.exec_module(mod)


class FallbackScraperTests(unittest.TestCase):
    def test_ebay_search_url_uses_sold_filters(self):
        url = mod.EbayScraper().build_search_url('Charizard 1st Edition PSA 10')
        self.assertIn('LH_Complete=1', url)
        self.assertIn('LH_Sold=1', url)
        self.assertIn('Charizard+1st+Edition+PSA+10', url)

    def test_goldin_search_url_uses_results_route(self):
        url = mod.GoldinScraper().build_search_url('Mario Pikachu PSA 9')
        self.assertEqual(url, 'https://goldin.co/results?search=Mario+Pikachu+PSA+9')

    def test_fanatics_search_url_uses_title_query(self):
        url = mod.FanaticsCollectScraper().build_search_url('Umbreon VMAX PSA 10')
        self.assertEqual(url, 'https://sales-history.fanaticscollect.com/?title=Umbreon+VMAX+PSA+10')

    def test_parse_price(self):
        self.assertEqual(mod.parse_price('$18,600'), 18600)
        self.assertEqual(mod.parse_price('w/ Buyers Premium $870'), 870)
        self.assertIsNone(mod.parse_price('not a price'))

    def test_parse_sale_date(self):
        self.assertEqual(mod.parse_sale_date('Sold on Jun 28, 2026 in Auction'), '2026-06-28')
        self.assertEqual(mod.parse_sale_date('2026-06-15'), '2026-06-15')

    def test_monotonic_grade_enforcement(self):
        values = mod.ensure_monotonic({'psa8': 500, 'psa9': 450, 'psa10': 300})
        self.assertEqual(values, {'psa8': 500, 'psa9': 500, 'psa10': 500})


if __name__ == '__main__':
    unittest.main()
