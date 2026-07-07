export type GiftContributionRow = {
  id: string
  gift_id: string
  amount: number
  payment_status: 'pending' | 'paid'
  provider_ref: string | null
  paid_at: string | null
  created_at: string
}

const money = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const dateFmt = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

export function formatPaymentLogDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return dateFmt.format(new Date(iso))
  } catch {
    return iso
  }
}

export function formatPaymentAmount(amount: number): string {
  return money.format(amount)
}

export function giftTitleForId(
  giftId: string,
  titles: Map<string, string>,
): string {
  return titles.get(giftId) ?? giftId
}

export function summarizePaidContributions(rows: GiftContributionRow[]) {
  let totalAmount = 0
  let paidCount = 0
  let pendingCount = 0
  for (const row of rows) {
    const amt = Number(row.amount)
    if (!Number.isFinite(amt)) continue
    if (row.payment_status === 'paid') {
      paidCount += 1
      totalAmount += amt
    } else {
      pendingCount += 1
    }
  }
  return {
    paidCount,
    pendingCount,
    totalAmount: Math.round(totalAmount * 100) / 100,
  }
}

function csvCell(s: string): string {
  const t = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  if (/[;\n"]/.test(t)) return `"${t.replace(/"/g, '""')}"`
  return t
}

export function paidContributionsToCsv(
  rows: GiftContributionRow[],
  giftTitles: Map<string, string>,
): string {
  const paid = rows.filter((r) => r.payment_status === 'paid')
  const header = [
    'Data do pagamento',
    'Presente',
    'Valor (R$)',
    'Ref. Mercado Pago',
    'Criado em',
  ]
  const lines = [
    header.map(csvCell).join(';'),
    ...paid.map((r) =>
      [
        formatPaymentLogDate(r.paid_at),
        giftTitleForId(r.gift_id, giftTitles),
        String(r.amount).replace('.', ','),
        r.provider_ref ?? '',
        formatPaymentLogDate(r.created_at),
      ]
        .map(csvCell)
        .join(';'),
    ),
  ]
  return `\uFEFF${lines.join('\r\n')}`
}
