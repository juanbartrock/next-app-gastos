import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeAmountInput, amountDigitsToNumber, formatAmountFromDigits } from './amount-utils'

test('normalizeAmountInput deja solo dígitos', () => {
  assert.equal(normalizeAmountInput('$ 12.345,67'), '1234567')
  assert.equal(normalizeAmountInput('abc'), '')
})

test('amountDigitsToNumber convierte centavos correctamente', () => {
  assert.equal(amountDigitsToNumber('12345'), 123.45)
  assert.equal(amountDigitsToNumber('9'), 0.09)
  assert.equal(amountDigitsToNumber(''), 0)
})

test('formatAmountFromDigits delega el formato', () => {
  const fakeFormat = (v: number) => `ARS ${v.toFixed(2)}`
  assert.equal(formatAmountFromDigits('12345', fakeFormat), 'ARS 123.45')
})
