import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const cards = JSON.parse(fs.readFileSync(new URL('../src/data/realPricingData.json', import.meta.url), 'utf8'))

const requiredTopNames = [
  'Illustrator Pikachu',
  '1st Edition Base Set Charizard',
  'Umbreon VMAX Alternate Art (Moonbreon)',
  'Mario Pikachu Full Art',
  'Shining Charizard 1st Edition',
  'Blastoise',
  'Venusaur',
  'Lugia',
  'Ho-oh',
  'Mewtwo',
  'Mew ex',
  'Gengar',
  'Dragonite',
  'Rayquaza VMAX',
  'Espeon VMAX',
  'Sylveon VMAX',
  'Glaceon VMAX',
  'Leafeon VMAX',
  'Charizard ex',
  'Venusaur ex',
  'Alakazam ex',
  'Giratina VSTAR',
  'Arceus VSTAR',
  'Lugia VSTAR',
]

test('main dataset contains 50 cards with official/local image URLs', () => {
  assert.equal(cards.length, 50)
  for (const card of cards) {
    assert.ok(card.name && typeof card.name === 'string', `missing name for ${card.cardId}`)
    assert.ok(card.imageUrls?.large, `missing large image for ${card.name}`)
    assert.ok(
      card.imageUrls.large.startsWith('/pokemon-tcg-dashboard/card-images/') || card.imageUrls.large.startsWith('https://images.pokemontcg.io/'),
      `non-official image source for ${card.name}: ${card.imageUrls.large}`,
    )
  }
})

test('main dataset is a top-card roster, not filler commons', () => {
  const names = new Set(cards.map((card) => card.name))
  for (const name of requiredTopNames) {
    assert.ok(names.has(name), `missing top card: ${name}`)
  }
  const bannedFiller = ['Hoppip', 'Skiploom', 'Seedot', 'Jumpluff']
  for (const name of bannedFiller) {
    assert.ok(!names.has(name), `filler card should not appear: ${name}`)
  }
})
