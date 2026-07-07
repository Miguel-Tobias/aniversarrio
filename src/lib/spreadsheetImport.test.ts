import { describe, expect, it } from 'vitest'
import { parseCsvText, validateGuestRows } from './spreadsheetImport'

describe('spreadsheetImport', () => {
  it('parseia CSV com separador ponto e vírgula', () => {
    const { headers, rows } = parseCsvText('Nome;Ordem\nMaria Silva;10\n')
    expect(headers).toEqual(['Nome', 'Ordem'])
    expect(rows).toHaveLength(1)
    expect(rows[0].Nome).toBe('Maria Silva')
  })

  it('valida convidados e gera id a partir do nome', () => {
    const { rows, errors } = validateGuestRows(
      ['Nome', 'Ordem'],
      [{ Nome: 'João Santos', Ordem: '20' }],
    )
    expect(errors).toHaveLength(0)
    expect(rows[0].name).toBe('João Santos')
    expect(rows[0].id).toBe('joao-santos')
    expect(rows[0].sort_order).toBe(20)
  })
})
