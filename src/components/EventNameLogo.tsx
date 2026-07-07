import { event } from '../config'

type Variant = 'hero' | 'nav' | 'banner'

type Props = {
  variant: Variant
}

const classByVariant: Record<Variant, string> = {
  hero: 'event-name event-name--hero',
  nav: 'event-name event-name--nav',
  banner: 'event-name event-name--banner',
}

export function EventNameLogo({ variant }: Props) {
  return (
    <span className={classByVariant[variant]}>
      {event.names}
    </span>
  )
}
