import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildPythonFallbackCommand,
  classifyApifyFailure,
} from './updatePricingData.js'

test('classifyApifyFailure identifies quota and rate-limit cases', () => {
  assert.equal(classifyApifyFailure(new Error('Account is out of credits')), 'quota')
  assert.equal(classifyApifyFailure(new Error('429 Too Many Requests from actor run')), 'rate-limit')
  assert.equal(classifyApifyFailure(new Error('Missing APIFY_API_TOKEN in .env')), 'missing-token')
  assert.equal(classifyApifyFailure(new Error('socket hang up')), 'unknown-error')
})

test('buildPythonFallbackCommand includes seed and output args', () => {
  const command = buildPythonFallbackCommand({
    pythonBin: '/root/pokemon-tcg-dashboard/scripts/.venv/bin/python',
    scriptPath: '/root/pokemon-tcg-dashboard/scripts/fallback_scraper.py',
    seedPath: '/root/pokemon-tcg-dashboard/src/data/mockPricingData.json',
    outputPath: '/root/pokemon-tcg-dashboard/src/data/realPricingData.json',
  })

  assert.match(command, /fallback_scraper\.py/)
  assert.match(command, /--seed/)
  assert.match(command, /mockPricingData\.json/)
  assert.match(command, /--output/)
  assert.match(command, /realPricingData\.json/)
})
