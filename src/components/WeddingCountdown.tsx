import { event } from '../config'
import {
  formatCountdownUnit,
  useWeddingCountdown,
} from '../hooks/useWeddingCountdown'

const units = [
  { key: 'days', label: 'Dias' },
  { key: 'hours', label: 'Horas' },
  { key: 'minutes', label: 'Minutos' },
  { key: 'seconds', label: 'Segundos' },
] as const

export function WeddingCountdown() {
  const parts = useWeddingCountdown(event.eventAt)

  if (parts.finished) {
    return (
      <section
        className="home-countdown home-countdown--done"
        aria-label="Contagem regressiva"
      >
        <p className="home-countdown__eyebrow">Chegou o momento</p>
        <p className="home-countdown__tagline">
          Hoje celebramos {event.years} anos
        </p>
      </section>
    )
  }

  return (
    <section className="home-countdown" aria-label="Contagem regressiva">
      <p className="home-countdown__eyebrow">
        Faltam para o {event.eventLabel}
      </p>
      <div className="home-countdown__grid" role="timer" aria-live="polite">
        {units.map(({ key, label }) => (
          <div key={key} className="home-countdown__cell">
            <span className="home-countdown__value">
              {key === 'days'
                ? String(parts.days)
                : formatCountdownUnit(parts[key])}
            </span>
            <span className="home-countdown__label">{label}</span>
          </div>
        ))}
      </div>
      <p className="home-countdown__tagline">
        Contando os momentos até a festa
      </p>
    </section>
  )
}
