import test from 'node:test'
import assert from 'node:assert/strict'
import { parseDDMMYYYY, formatDateToDDMMYYYY, isValidDDMMYYYY } from './date-utils'

test('parseDDMMYYYY parsea fechas válidas', () => {
  const date = parseDDMMYYYY('29/02/2024')
  assert.ok(date)
  assert.equal(date?.getFullYear(), 2024)
  assert.equal(date?.getMonth(), 1)
  assert.equal(date?.getDate(), 29)
})

test('parseDDMMYYYY rechaza fechas inválidas', () => {
  assert.equal(parseDDMMYYYY('31/02/2026'), undefined)
  assert.equal(parseDDMMYYYY('99/99/9999'), undefined)
  assert.equal(parseDDMMYYYY(''), undefined)
})

test('formatDateToDDMMYYYY formatea correctamente', () => {
  const date = new Date(2026, 1, 19)
  assert.equal(formatDateToDDMMYYYY(date), '19/02/2026')
})

test('isValidDDMMYYYY devuelve true/false correctamente', () => {
  assert.equal(isValidDDMMYYYY('01/01/2026'), true)
  assert.equal(isValidDDMMYYYY('31/02/2026'), false)
})
