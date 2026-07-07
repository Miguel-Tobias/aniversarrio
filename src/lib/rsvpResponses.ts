export type RsvpResponseRow = {
  id: string
  guest_id: string | null
  full_name: string
  email: string | null
  phone: string | null
  attending: 'yes' | 'no' | 'maybe'
  guest_count: number
  dietary_notes: string | null
  message: string | null
  created_at: string
  updated_at?: string | null
}

const attendingPt: Record<RsvpResponseRow['attending'], string> = {
  yes: 'Sim',
  no: 'Não',
  maybe: 'Talvez',
}

export function rsvpAttendingLabel(a: RsvpResponseRow['attending']): string {
  return attendingPt[a] ?? a
}

const dateFmt = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

export function formatRsvpReportDate(iso: string): string {
  try {
    return dateFmt.format(new Date(iso))
  } catch {
    return iso
  }
}

/** Data da última confirmação ou alteração (para o relatório). */
export function rsvpLastActivityAt(row: RsvpResponseRow): string {
  const updated = row.updated_at?.trim()
  return updated || row.created_at
}

/** Contagens para o resumo no admin. */
export function rsvpGuestNameKey(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
}

/** Resposta mais recente por nome (lista já ordenada da mais nova para a mais antiga). */
export function latestRsvpByGuestName(
  rows: RsvpResponseRow[],
): Map<string, RsvpResponseRow> {
  const map = new Map<string, RsvpResponseRow>()
  for (const row of rows) {
    const key = rsvpGuestNameKey(row.full_name)
    if (!map.has(key)) map.set(key, row)
  }
  return map
}

/** Resposta actual por id de convidado (preferir sobre duplicados antigos por nome). */
export function latestRsvpByGuestId(
  rows: RsvpResponseRow[],
): Map<string, RsvpResponseRow> {
  const map = new Map<string, RsvpResponseRow>()
  for (const row of rows) {
    const id = row.guest_id?.trim()
    if (!id || map.has(id)) continue
    map.set(id, row)
  }
  return map
}

/** Uma linha por convidado: só a resposta mais recente (sem histórico). */
export function effectiveRsvpRows(rows: RsvpResponseRow[]): RsvpResponseRow[] {
  const sorted = [...rows].sort(
    (a, b) =>
      new Date(rsvpLastActivityAt(b)).getTime() -
      new Date(rsvpLastActivityAt(a)).getTime(),
  )
  const seenGuestIds = new Set<string>()
  const seenNames = new Set<string>()
  const result: RsvpResponseRow[] = []

  for (const row of sorted) {
    const id = row.guest_id?.trim()
    const nameKey = rsvpGuestNameKey(row.full_name)

    if (nameKey && seenNames.has(nameKey)) continue
    if (id && seenGuestIds.has(id)) continue

    result.push(row)
    if (nameKey) seenNames.add(nameKey)
    if (id) seenGuestIds.add(id)
  }

  return result
}

export function summarizeRsvpRows(rows: RsvpResponseRow[]) {
  const effective = effectiveRsvpRows(rows)
  let yes = 0
  let no = 0
  let maybe = 0
  let headsConfirmed = 0
  for (const r of effective) {
    if (r.attending === 'yes') {
      yes += 1
      headsConfirmed += Math.max(0, r.guest_count)
    }
    else if (r.attending === 'no') no += 1
    else maybe += 1
  }
  return { yes, no, maybe, headsConfirmed, total: effective.length }
}

function csvCell(s: string): string {
  const t = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  if (/[;\n"]/.test(t)) return `"${t.replace(/"/g, '""')}"`
  return t
}

/** CSV com separador `;` para abrir bem no Excel em PT. */
export function rsvpRowsToCsv(rows: RsvpResponseRow[]): string {
  const effective = effectiveRsvpRows(rows)
  const header = ['Data do registro', 'Nome', 'Presença']
  const lines = [
    header.map(csvCell).join(';'),
    ...effective.map((r) =>
      [
        formatRsvpReportDate(rsvpLastActivityAt(r)),
        r.full_name,
        rsvpAttendingLabel(r.attending),
      ]
        .map(csvCell)
        .join(';'),
    ),
  ]
  return `\uFEFF${lines.join('\r\n')}`
}
