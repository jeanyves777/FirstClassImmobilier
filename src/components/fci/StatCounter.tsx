'use client'

import { motion, useInView, useMotionValue, useSpring } from 'framer-motion'
import { useEffect, useRef } from 'react'

export function StatCounter({
  value,
  label,
  suffix = '+',
}: {
  value: number
  label: string
  suffix?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const mv = useMotionValue(0)
  const spring = useSpring(mv, { stiffness: 60, damping: 20 })

  useEffect(() => {
    if (inView) mv.set(value)
  }, [inView, mv, value])

  useEffect(() => {
    const unsub = spring.on('change', (latest) => {
      if (!ref.current) return
      ref.current.textContent = Math.floor(latest).toLocaleString()
    })
    return unsub
  }, [spring])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col items-center text-center"
    >
      <span className="font-display text-4xl font-semibold tracking-tight text-[color:var(--brand-navy)] dark:text-foreground sm:text-5xl">
        <span ref={ref}>0</span>
        <span className="text-[color:var(--brand-red)]">{suffix}</span>
      </span>
      <span className="mt-2 text-sm uppercase tracking-[0.18em] text-muted">{label}</span>
    </motion.div>
  )
}
