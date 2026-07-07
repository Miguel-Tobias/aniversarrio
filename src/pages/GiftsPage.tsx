import { useCallback, useEffect, useMemo, useState } from 'react'
import { CoupleLogo } from '../components/CoupleLogo'
import {
  getPixEnv,
  isPixConfigured,
  event,
  type Gift,
} from '../config'
import { usePublicGifts } from '../hooks/usePublicGifts'
import { gerarBrCodePix } from '../lib/gerarBrCodePix'
import { PixQrImage } from '../PixQrImage'

const money = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [locked])
}

export function GiftsPage() {
  const {
    gifts,
    loading: giftsCatalogLoading,
    error: giftsCatalogError,
  } = usePublicGifts()
  const [selected, setSelected] = useState<Gift | null>(null)
  const [copied, setCopied] = useState(false)

  const pixReady = isPixConfigured()

  const pixResult = useMemo(() => {
    if (!selected || !pixReady) return null
    const { pixKey, merchantName, merchantCity } = getPixEnv()
    const desc = `Presente ${selected.price.toFixed(2)}`
    return gerarBrCodePix({
      pixKey,
      merchantName,
      merchantCity,
      transactionAmount: selected.price,
      infoAdicional: desc.slice(0, 72),
    })
  }, [selected, pixReady])

  const brCode = pixResult?.ok === true ? pixResult.brCode : ''
  const pixFailMessage =
    selected && pixResult?.ok === false ? pixResult.message : null

  useBodyScrollLock(Boolean(selected))

  const closeModal = useCallback(() => {
    setSelected(null)
    setCopied(false)
  }, [])

  useEffect(() => {
    if (!selected) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, closeModal])

  const copyCode = async () => {
    if (!brCode) return
    try {
      await navigator.clipboard.writeText(brCode)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      setCopied(false)
    }
  }

  return (
    <>
      <header className="page-hero" aria-label="Lista de presentes">
        <div className="page-hero__inner">
          <div className="page-hero__eyebrow page-hero__eyebrow--logo">
            <CoupleLogo variant="banner" />
          </div>
          <h1 className="page-hero__title">Lista de presentes</h1>
          <p className="page-hero__lead">{event.tagline}</p>
        </div>
      </header>

      <main id="conteudo" className="main">
        {giftsCatalogLoading ? (
          <p className="intro__text" role="status">
            Carregando a lista de presentes…
          </p>
        ) : null}
        {giftsCatalogError ? (
          <div className="alert" role="alert">
            Não foi possível carregar a lista de presentes do servidor. Estamos
            exibindo a lista local de reserva.
            {import.meta.env.DEV ? (
              <span className="admin-muted"> ({giftsCatalogError})</span>
            ) : null}
          </div>
        ) : null}
        <section className="intro">
          <p className="intro__sub intro__sub--gifts">
            Seu presente nos emociona de verdade. Escolha um valor abaixo e
            pague via <strong>PIX</strong> no app do seu banco — é rápido e
            seguro.
          </p>
          {!pixReady && (
            <div className="alert" role="status">
              A lista de presentes online estará disponível em breve. Para
              contribuir agora, entre em contato conosco.
            </div>
          )}
        </section>

        <ul className="gift-grid gift-grid--amounts" aria-busy={giftsCatalogLoading}>
          {gifts.map((gift) => (
            <li key={gift.id}>
              <article className="gift-card gift-card--amount">
                <div className="gift-card__accent" aria-hidden />
                <div className="gift-card__body gift-card__body--amount">
                  <p className="gift-card__price">{money.format(gift.price)}</p>
                  {gift.description ? (
                    <p className="gift-card__desc">{gift.description}</p>
                  ) : null}
                  <button
                    type="button"
                    className="gift-card__cta"
                    onClick={() => setSelected(gift)}
                    disabled={!pixReady}
                  >
                    Presentear
                  </button>
                </div>
              </article>
            </li>
          ))}
        </ul>
        {!giftsCatalogLoading && gifts.length === 0 ? (
          <p className="intro__text" role="status">
            A lista de presentes será publicada em breve.
          </p>
        ) : null}
      </main>

      <footer className="footer">
        <p>Com carinho, {event.names}</p>
      </footer>

      {selected && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={closeModal}
        >
          <div
            className="modal modal--wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="modal__close"
              onClick={closeModal}
              aria-label="Fechar"
            >
              ×
            </button>

            <h2 id="modal-title" className="modal__title">
              Presente — {money.format(selected.price)}
            </h2>
            <p className="modal__amount">
              Valor: <strong>{money.format(selected.price)}</strong>
            </p>
            {!pixReady ? (
              <p className="modal__error" role="alert">
                PIX não configurado. Preencha VITE_PIX_KEY, VITE_PIX_MERCHANT_NAME e
                VITE_PIX_MERCHANT_CITY no arquivo .env e reinicie o servidor.
              </p>
            ) : pixFailMessage && !brCode ? (
              <p className="modal__error" role="alert">
                {pixFailMessage}
              </p>
            ) : brCode ? (
              <>
                <div className="modal__qr">
                  <div className="modal__qr-box">
                    <PixQrImage emvBrCode={brCode} />
                  </div>
                </div>
                <p className="modal__hint">
                  Abra o app do seu banco, escolha PIX e escaneie o QR Code ou
                  cole o código copia e cola.
                </p>
                <button
                  type="button"
                  className="modal__copy"
                  onClick={copyCode}
                >
                  {copied ? 'Código copiado!' : 'Copiar código PIX'}
                </button>
                <p className="modal__hint">
                  Obrigado pelo carinho! Você pode fechar esta janela após
                  concluir o pagamento.
                </p>
              </>
            ) : (
              <p className="modal__error">
                Não foi possível exibir o código PIX. Tente novamente.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
