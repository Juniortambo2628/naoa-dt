import { describe, it, expect } from 'vitest'
import { normalizeKenyanPhone, formatKenyanPhone, formatKes, newIdempotencyKey } from './mpesa'

describe('mpesa helpers', () => {
  it('normalises the ways people type Kenyan numbers', () => {
    for (const input of ['0712 345 678', '+254712345678', '712345678', '254712345678', '0712-345-678']) {
      expect(normalizeKenyanPhone(input)).toBe('254712345678')
    }
    expect(normalizeKenyanPhone('0110 123 456')).toBe('254110123456')
  })

  it('rejects numbers that are not Kenyan mobiles', () => {
    for (const input of ['', null, '12345', '0201234567', '+447700900123']) {
      expect(normalizeKenyanPhone(input)).toBeNull()
    }
  })

  it('formats for display', () => {
    expect(formatKenyanPhone('254712345678')).toBe('0712 345 678')
    expect(formatKes(1000)).toBe('KES 1,000')
    expect(formatKes(undefined)).toBe('KES 0')
  })

  it('makes a new key each time', () => {
    expect(newIdempotencyKey()).not.toBe(newIdempotencyKey())
  })
})
