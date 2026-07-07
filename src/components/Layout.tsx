import { useCallback, useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { CoupleLogo } from './CoupleLogo'
import { FlamengoPattern } from './FlamengoPattern'
import { event } from '../config'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `site-nav__link${isActive ? ' site-nav__link--active' : ''}`

const navItems = [
  { to: '/', label: 'Início', end: true },
  { to: '/confirmar', label: 'Confirmar presença', end: false },
] as const

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  const closeMenu = useCallback(() => setMenuOpen(false), [])

  useEffect(() => {
    closeMenu()
  }, [location.pathname, closeMenu])

  useEffect(() => {
    if (!menuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen, closeMenu])

  return (
    <div className="app">
      <FlamengoPattern tone="light" className="flamengo-pattern--fixed" />
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo
      </a>
      <nav className="site-nav" aria-label="Seções do site">
        <div className="site-nav__inner">
          <NavLink
            to="/"
            className="site-nav__brand site-nav__brand--logo"
            aria-label={`Início — ${event.names}`}
            end
            onClick={closeMenu}
          >
            <CoupleLogo variant="nav" />
          </NavLink>

          <button
            type="button"
            className="site-nav__toggle"
            aria-expanded={menuOpen}
            aria-controls="site-nav-panel"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="site-nav__toggle-icon" aria-hidden>
              <span />
              <span />
              <span />
            </span>
            <span className="site-nav__toggle-label">
              {menuOpen ? 'Fechar menu' : 'Abrir menu'}
            </span>
          </button>

          <div
            id="site-nav-panel"
            className={`site-nav__panel${menuOpen ? ' site-nav__panel--open' : ''}`}
          >
            <div className="site-nav__links">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={navClass}
                  end={item.end}
                  onClick={closeMenu}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
        {menuOpen ? (
          <button
            type="button"
            className="site-nav__backdrop"
            aria-label="Fechar menu"
            onClick={closeMenu}
          />
        ) : null}
      </nav>
      <Outlet />
    </div>
  )
}
