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
  { id: 'stefany', name: 'Stefany' },
  { id: 'ana-beatriz', name: 'Ana Beatriz' },
  { id: 'laryssa', name: 'Laryssa' },
  { id: 'yuri', name: 'Yuri' },
  { id: 'ana-clara', name: 'Ana Clara' },
  { id: 'ana-laura', name: 'Ana Laura' },
  { id: 'fabricio', name: 'Fabrício' },
  { id: 'lucas', name: 'Lucas' },
  { id: 'cristian', name: 'Cristian' },
  { id: 'namorada-do-cristian', name: 'Namorada do Cristian' },
  { id: 'caio', name: 'Caio' },
  { id: 'hellen', name: 'Hellen' },
  { id: 'pedro', name: 'Pedro' },
  { id: 'sarah', name: 'Sarah' },
  { id: 'fernanda-e-henrique', name: 'Fernanda e o Henrique' },
]
