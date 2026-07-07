import { useEffect, useState } from 'react'

import QRCode from 'qrcode'

type Props = {
  /** Payload EMV PIX (copia-e-cola). */
  emvBrCode: string
  /** Imagem PNG em base64 cru, quando o Mercado Pago envia só qr_code_base64. */
  pngBase64?: string | null
}

export function PixQrImage({ emvBrCode, pngBase64 }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    void Promise.resolve().then(async () => {
      if (!alive) return
      setDataUrl(null)
      setError(null)

      if (pngBase64 && pngBase64.trim() !== '') {
        setDataUrl(`data:image/png;base64,${pngBase64.trim()}`)
        return
      }

      const emv = emvBrCode.trim()
      if (!emv) {
        setError('Código PIX em branco.')
        return
      }

      try {
        const url = await QRCode.toDataURL(emv, {
          errorCorrectionLevel: 'H',
          width: 240,
          margin: 2,
          color: { dark: '#27272a', light: '#ffffff' },
        })
        if (alive) setDataUrl(url)
      } catch (e: unknown) {
        if (alive)
          setError(e instanceof Error ? e.message : 'Falha ao gerar o QR Code')
      }
    })

    return () => {
      alive = false
    }
  }, [emvBrCode, pngBase64])

  if (error) {
    return (
      <p className="modal__error" role="alert">
        Não foi possível gerar o QR Code. Tente usar{' '}
        <strong>Copiar código PIX</strong> abaixo.
      </p>
    )
  }

  if (!dataUrl) {
    return <p className="modal__hint">Gerando QR Code…</p>
  }

  return (
    <img
      className="modal__qr-img"
      src={dataUrl}
      alt="QR Code para pagamento PIX"
      width={240}
      height={240}
      decoding="async"
    />
  )
}
