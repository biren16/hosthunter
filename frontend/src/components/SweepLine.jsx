import { useEffect, useState } from 'react'

/**
 * SweepLine — the ONE signature animation.
 * A thin teal line that sweeps down the viewport once when a scan starts.
 * Respects prefers-reduced-motion via CSS (display: none in index.css).
 *
 * Props:
 *   active: boolean — when true, mounts and plays; auto-unmounts after animation
 */
export default function SweepLine({ active }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!active) return
    setVisible(true)
    const timer = setTimeout(() => setVisible(false), 850)
    return () => clearTimeout(timer)
  }, [active])

  if (!visible) return null

  return <div className="sweep-line" aria-hidden="true" />
}
