import { normalizePixKey } from './lib/normalizePixKey'
import {
  normalizePixMerchantCity,
  normalizePixMerchantName,
} from './lib/normalizePixMerchant'

export type Gift = {
  id: string
  title: string
  description: string
  price: number
}

/** Valores fixos da lista de presentes (sem fotos). */
export const giftFixedAmounts = [50, 100, 150, 200] as const

function giftFromAmount(price: number): Gift {
  const label = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price)
  return {
    id: `presente-${price}`,
    title: label,
    description: '',
    price,
  }
}

export const gifts: Gift[] = giftFixedAmounts.map(giftFromAmount)

export type EventPhoto = {
  src: string
  alt: string
}

/** Convidado na lista de confirmação de presença. */
export type InvitedGuest = {
  id: string
  name: string
}

/** Dados centrais do evento — edite nomes, datas e textos aqui. */
export const event = {
  names: 'Miguel Vaz',
  eventLabel: 'Aniversário',
  years: 22,
  logoAlt: 'Miguel Vaz',
  date: 'Data do evento',
  time: '19:00',
  timeDetail: 'Às 19 horas',
  eventAt: '2027-06-15T19:00:00-03:00',
  tagline:
    'Uma festa especial para celebrar com quem faz parte da nossa história.',
  photosSectionTitle: 'Momentos especiais',
  venue: 'Studio Pub',
  venueName: 'Studio Pub',
  venueAddress: 'Endereço completo',
  mapsUrl: '',
  mapsEmbedUrl: '',
  eventPhotos: [
    {
      src: '/fotos/foto-01.jpg',
      alt: 'Miguel Vaz',
    },
    {
      src: '/fotos/foto-02.jpg',
      alt: 'Miguel Vaz',
    },
  ] satisfies EventPhoto[],
}

export const invitedGuests: InvitedGuest[] = [
  { id: 'maria-silva', name: 'Maria Silva' },
  { id: 'joao-santos', name: 'João Santos' },
  { id: 'familia-oliveira', name: 'Família Oliveira' },
]

export function getPixEnv() {
  return {
    pixKey: normalizePixKey(String(import.meta.env.VITE_PIX_KEY ?? '')),
    merchantName: normalizePixMerchantName(
      String(import.meta.env.VITE_PIX_MERCHANT_NAME ?? ''),
    ),
    merchantCity: normalizePixMerchantCity(
      String(import.meta.env.VITE_PIX_MERCHANT_CITY ?? ''),
    ),
  }
}

export function isPixConfigured(): boolean {
  const { pixKey, merchantName, merchantCity } = getPixEnv()
  return Boolean(pixKey && merchantName && merchantCity)
}
