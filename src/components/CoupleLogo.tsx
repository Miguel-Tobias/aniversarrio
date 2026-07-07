import { event } from '../config'

type Variant = 'hero' | 'nav' | 'banner'

type Props = {
  variant: Variant
}

const classByVariant: Record<Variant, string> = {
  hero: 'couple-names couple-names--hero',
  nav: 'couple-names couple-names--nav',
  banner: 'couple-names couple-names--banner',
}

function splitCoupleNames(names: string): [string, string] {
  const parts = names.split(/\s*&\s*/)
  if (parts.length >= 2) {
    return [parts[0].trim(), parts.slice(1).join(' & ').trim()]
  }
  return [names.trim(), '']
}

export function CoupleLogo({ variant }: Props) {
  const [first, second] = splitCoupleNames(event.names)

  return (
    <span className={classByVariant[variant]}>
      <span className="couple-names__line">
        <span className="couple-names__person">{first}</span>
        {second ? (
          <>
            <span className="couple-names__amp" aria-hidden="true">
              &amp;
            </span>
            <span className="couple-names__person">{second}</span>
          </>
        ) : null}
      </span>
    </span>
  )
}
