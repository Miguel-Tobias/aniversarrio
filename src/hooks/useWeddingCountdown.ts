import { useEffect, useState } from 'react'

export type CountdownParts = {
  days: number
  hours: number
  minutes: number
  seconds: number
  finished: boolean
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function partsFromMs(ms: number): CountdownParts {
  if (ms <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, finished: true }
  }
  const totalSec = Math.floor(ms / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60
  return { days, hours, minutes, seconds, finished: false }
}

export function useWeddingCountdown(targetIso: string): CountdownParts {
  const [parts, setParts] = useState<CountdownParts>(() =>
    partsFromMs(new Date(targetIso).getTime() - Date.now()),
  )

  useEffect(() => {
    const target = new Date(targetIso).getTime()
    const tick = () => setParts(partsFromMs(target - Date.now()))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [targetIso])

  return parts
}

export function formatCountdownUnit(value: number): string {
  return pad2(value)
}
