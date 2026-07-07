import { Link } from 'react-router-dom'
import { EventNameLogo } from '../components/EventNameLogo'
import { FlamengoPattern } from '../components/FlamengoPattern'
import { event } from '../config'

export function HomePage() {
  return (
    <>
      <header id="conteudo" className="hero hero--home" aria-label="Capa — Aniversário">
        <FlamengoPattern tone="dark" />
        <div className="hero__texture" aria-hidden />
        <div className="hero__frame hero__frame--wide">
          <p className="hero__eyebrow">
            {event.eventLabel} · {event.years} anos
          </p>
          <h1 className="hero__title-logo">
            <EventNameLogo variant="hero" />
          </h1>
          <p className="hero__date">{event.date}</p>
          <p className="hero__venue">{event.venue}</p>
          <p className="hero__time">{event.timeDetail}</p>
          <p className="hero__venue">Sua presença é muito importante para mim.</p>
          <div className="hero__cta-row">
            <Link className="hero__cta hero__cta--primary" to="/confirmar">
              Confirmar minha presença
            </Link>
          </div>
        </div>
      </header>

      <footer className="footer">
        <p>Com carinho, {event.names}</p>
      </footer>
    </>
  )
}
