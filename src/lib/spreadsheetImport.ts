import type { SupabaseClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'

export type SheetRow = Record<string, string>

export type GuestImportRow = {
  id: string
  name: string
  sort_order: number
  lineNumber: number
}

export type ImportValidationError = {
  line: number
  message: string
}

export type ImportResult = {
  inserted: number
  updated: number
  errors: string[]
}

function normalizeHeader(h: string): string {
  return h
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
}

function slugFromLabel(s: string): string {
  const base = s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72)
  return base || `item-${crypto.randomUUID().slice(0, 8)}`
}

function uniqueSlug(base: string, used: Set<string>): string {
  let id = slugFromLabel(base)
  if (!used.has(id)) {
    used.add(id)
    return id
  }
  let n = 2
  while (used.has(`${id}-${n}`)) n += 1
  const next = `${id}-${n}`
  used.add(next)
  return next
}

function parseSort(raw: string, fallback: number): number {
  const t = raw.trim()
  if (t === '') return fallback
  const n = Number(t.replace(',', '.'))
  return Number.isFinite(n) ? Math.trunc(n) : fallback
}

function detectDelimiter(line: string): ',' | ';' {
  const semi = (line.match(/;/g) ?? []).length
  const comma = (line.match(/,/g) ?? []).length
  return semi >= comma ? ';' : ','
}

function parseCsvLine(line: string, delim: ',' | ';'): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        cur += ch
      }
      continue
    }
    if (ch === '"') {
      inQuotes = true
      continue
    }
    if (ch === delim) {
      out.push(cur.trim())
      cur = ''
      continue
    }
    cur += ch
  }
  out.push(cur.trim())
  return out
}

export function parseCsvText(text: string): { headers: string[]; rows: SheetRow[] } {
  const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalized.split('\n').filter((l) => l.trim() !== '')
  if (lines.length === 0) {
    return { headers: [], rows: [] }
  }
  const delim = detectDelimiter(lines[0])
  const headers = parseCsvLine(lines[0], delim).map((h) => h.trim())
  const rows: SheetRow[] = []
  for (let i = 1; i < lines.length; i += 1) {
    const cells = parseCsvLine(lines[i], delim)
    if (cells.every((c) => c.trim() === '')) continue
    const row: SheetRow = {}
    headers.forEach((h, idx) => {
      row[h] = cells[idx] ?? ''
    })
    rows.push(row)
  }
  return { headers, rows }
}

export function parseXlsxBuffer(buffer: ArrayBuffer): { headers: string[]; rows: SheetRow[] } {
  const wb = XLSX.read(buffer, { type: 'array' })
  const sheetName = wb.SheetNames[0]
  if (!sheetName) return { headers: [], rows: [] }
  const sheet = wb.Sheets[sheetName]
  const matrix = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  })
  if (matrix.length === 0) return { headers: [], rows: [] }
  const headerRow = matrix[0] ?? []
  const headers = headerRow.map((c) => String(c ?? '').trim())
  const rows: SheetRow[] = []
  for (let i = 1; i < matrix.length; i += 1) {
    const line = matrix[i] ?? []
    if (line.every((c) => String(c ?? '').trim() === '')) continue
    const row: SheetRow = {}
    headers.forEach((h, idx) => {
      row[h] = String(line[idx] ?? '').trim()
    })
    rows.push(row)
  }
  return { headers, rows }
}

export async function parseSpreadsheetFile(
  file: File,
): Promise<{ headers: string[]; rows: SheetRow[] }> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.csv')) {
    const text = await file.text()
    return parseCsvText(text)
  }
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const buffer = await file.arrayBuffer()
    return parseXlsxBuffer(buffer)
  }
  throw new Error('Formato não suportado. Use CSV ou Excel (.xlsx).')
}

const GUEST_FIELDS = new Map<string, 'id' | 'name' | 'sort_order'>([
  ['id', 'id'],
  ['nome', 'name'],
  ['name', 'name'],
  ['convidado', 'name'],
  ['ordem', 'sort_order'],
  ['order', 'sort_order'],
  ['sort', 'sort_order'],
  ['sort_order', 'sort_order'],
])

function mapRow(
  raw: SheetRow,
  fieldMap: Map<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [header, value] of Object.entries(raw)) {
    const key = fieldMap.get(header)
    if (key) out[key] = String(value ?? '').trim()
  }
  return out
}

function buildFieldMap(
  headers: string[],
  aliases: Map<string, string>,
): Map<string, string> {
  const map = new Map<string, string>()
  for (const h of headers) {
    const field = aliases.get(normalizeHeader(h))
    if (field) map.set(h, field)
  }
  return map
}

export function validateGuestRows(
  headers: string[],
  rows: SheetRow[],
): { rows: GuestImportRow[]; errors: ImportValidationError[] } {
  const fieldMap = buildFieldMap(headers, GUEST_FIELDS)
  if (![...fieldMap.values()].includes('name')) {
    return {
      rows: [],
      errors: [{ line: 1, message: 'A planilha precisa da coluna «Nome».' }],
    }
  }
  const usedIds = new Set<string>()
  const parsed: GuestImportRow[] = []
  const errors: ImportValidationError[] = []

  rows.forEach((raw, idx) => {
    const line = idx + 2
    const m = mapRow(raw, fieldMap)
    const name = m.name?.trim() ?? ''
    if (!name) {
      errors.push({ line, message: 'Nome vazio.' })
      return
    }
    const explicitId = m.id?.trim() ?? ''
    const id = explicitId || uniqueSlug(name, usedIds)
    if (explicitId) usedIds.add(id)
    const sort_order = parseSort(m.sort_order ?? '', (parsed.length + 1) * 10)
    parsed.push({ id, name, sort_order, lineNumber: line })
  })

  return { rows: parsed, errors }
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([`\uFEFF${content}`], {
    type: 'text/csv;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function downloadGuestsTemplate() {
  downloadCsv(
    'modelo-convidados.csv',
    'Nome;Ordem\r\nMaria Silva;10\r\nJoão Santos;20\r\nFamília Oliveira;30',
  )
}

export async function importGuestsToSupabase(
  sb: SupabaseClient,
  rows: GuestImportRow[],
  existingIds: Set<string>,
): Promise<ImportResult> {
  let inserted = 0
  let updated = 0
  const errors: string[] = []
  const now = new Date().toISOString()

  for (const row of rows) {
    const payload = {
      id: row.id,
      name: row.name,
      sort_order: row.sort_order,
      updated_at: now,
    }
    const isUpdate = existingIds.has(row.id)
    const { error } = isUpdate
      ? await sb.from('wedding_invited_guests').update(payload).eq('id', row.id)
      : await sb.from('wedding_invited_guests').insert(payload)

    if (error) {
      errors.push(`Linha ${row.lineNumber} (${row.name}): ${error.message}`)
      continue
    }
    if (isUpdate) updated += 1
    else inserted += 1
    existingIds.add(row.id)
  }

  return { inserted, updated, errors }
}
