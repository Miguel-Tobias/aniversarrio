import { stripEnvQuotes } from './stripEnvQuotes'

function stripAccents(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/** Nome do recebedor — até 25 caracteres, sem acentos (padrão PIX). */
export function normalizePixMerchantName(raw: string): string {
  return stripAccents(stripEnvQuotes(String(raw ?? ''))).substring(0, 25)
}

/** Cidade do recebedor — até 15 caracteres, sem acentos (ex.: BELEM). */
export function normalizePixMerchantCity(raw: string): string {
  return stripAccents(stripEnvQuotes(String(raw ?? ''))).substring(0, 15)
}

/** Texto livre no PIX — evita caracteres que alguns bancos rejeitam. */
export function normalizePixInfoAdicional(raw: string): string {
  return stripAccents(raw)
    .replace(/[^\w\s@.,\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 72)
}
