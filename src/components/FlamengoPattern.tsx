type FlamengoImage = 'escudo' | 'crf'

type PatternItem = {
  image: FlamengoImage
  top?: string
  left?: string
  right?: string
  bottom?: string
  size: number
  rotate: number
  opacity?: number
}

const IMAGES: Record<FlamengoImage, string> = {
  escudo: '/flamengo/escudo.png',
  crf: '/flamengo/crf.png',
}

const PATTERN_ITEMS: PatternItem[] = [
  { image: 'escudo', top: '4%', left: '2%', size: 36, rotate: -18 },
  { image: 'crf', top: '2%', left: '11%', size: 44, rotate: 5 },
  { image: 'crf', top: '7%', right: '3%', size: 40, rotate: -8 },
  { image: 'escudo', top: '14%', right: '11%', size: 32, rotate: 14 },
  { image: 'escudo', top: '21%', left: '5%', size: 28, rotate: -6 },
  { image: 'crf', top: '27%', left: '18%', size: 38, rotate: 10 },
  { image: 'escudo', top: '34%', right: '5%', size: 34, rotate: -12 },
  { image: 'crf', top: '41%', left: '2%', size: 42, rotate: 7 },
  { image: 'escudo', top: '47%', left: '14%', size: 30, rotate: -20 },
  { image: 'crf', top: '51%', right: '14%', size: 46, rotate: -5 },
  { image: 'escudo', top: '57%', right: '1%', size: 36, rotate: 16 },
  { image: 'crf', top: '61%', left: '7%', size: 40, rotate: -10 },
  { image: 'escudo', top: '69%', left: '20%', size: 32, rotate: 8 },
  { image: 'crf', top: '74%', right: '9%', size: 44, rotate: 12 },
  { image: 'escudo', top: '79%', left: '3%', size: 28, rotate: -14 },
  { image: 'crf', top: '84%', left: '16%', size: 38, rotate: 6 },
  { image: 'escudo', top: '87%', right: '17%', size: 34, rotate: -8 },
  { image: 'crf', top: '17%', left: '34%', size: 36, rotate: -15 },
  { image: 'escudo', top: '54%', left: '44%', size: 26, rotate: 20 },
  { image: 'crf', top: '37%', right: '27%', size: 42, rotate: -7 },
  { image: 'escudo', top: '11%', left: '54%', size: 30, rotate: 11 },
  { image: 'crf', top: '67%', right: '34%', size: 36, rotate: -12 },
  { image: 'escudo', top: '44%', right: '42%', size: 24, rotate: -9 },
  { image: 'crf', top: '90%', right: '4%', size: 34, rotate: 15 },
]

export type FlamengoPatternTone = 'dark' | 'light'

type Props = {
  tone?: FlamengoPatternTone
  className?: string
}

export function FlamengoPattern({ tone = 'dark', className }: Props) {
  const rootClass = [
    'flamengo-pattern',
    `flamengo-pattern--${tone}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rootClass} aria-hidden>
      {PATTERN_ITEMS.map((item, index) => (
        <img
          key={`${item.image}-${index}`}
          className="flamengo-pattern__item"
          src={IMAGES[item.image]}
          alt=""
          width={item.size}
          height={item.size}
          style={{
            top: item.top,
            left: item.left,
            right: item.right,
            bottom: item.bottom,
            width: item.size,
            transform: `rotate(${item.rotate}deg)`,
            ...(item.opacity != null ? { opacity: item.opacity } : {}),
          }}
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      ))}
    </div>
  )
}
