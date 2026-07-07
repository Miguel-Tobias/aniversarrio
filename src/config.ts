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
    'Uma festa especial para celebrar com quem faz parte da minha história.',
  venue: 'Studio Pub',
  venueName: 'Studio Pub',
  venueAddress: 'Endereço completo',
  mapsUrl: '',
  mapsEmbedUrl: '',
}

export const invitedGuests: InvitedGuest[] = [
  { id: 'maria-silva', name: 'Maria Silva' },
  { id: 'joao-santos', name: 'João Santos' },
  { id: 'familia-oliveira', name: 'Família Oliveira' },
]
