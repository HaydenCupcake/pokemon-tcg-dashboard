import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const realData = JSON.parse(fs.readFileSync(new URL('../src/data/realPricingData.json', import.meta.url), 'utf8'))
const mockData = JSON.parse(fs.readFileSync(new URL('../src/data/mockPricingData.json', import.meta.url), 'utf8'))

function assertCuratedDataset(cards, label) {
  assert.equal(cards.length, 50, `${label}: expected 50 cards`)
  assert.equal(new Set(cards.map((card) => card.cardId)).size, 50, `${label}: duplicate cardIds found`)
  assert.ok(new Set(cards.map((card) => card.set)).size >= 8, `${label}: expected cards from at least 8 sets`)
  assert.ok(new Set(cards.map((card) => card.theme).filter(Boolean)).size >= 5, `${label}: expected at least 5 theme buckets`)
}

test('realPricingData.json is a curated 50-card multi-set dataset', () => {
  assertCuratedDataset(realData, 'realPricingData')
})

test('mockPricingData.json is a curated 50-card multi-set dataset', () => {
  assertCuratedDataset(mockData, 'mockPricingData')
})
