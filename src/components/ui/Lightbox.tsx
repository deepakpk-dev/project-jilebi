'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'

type Props = {
  src: string
  alt: string
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  prevLabel: string
  nextLabel: string
  closeLabel: string
}

const ChevronLeft = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M14.5 6 L8.5 12 L14.5 18"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const ChevronRight = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M9.5 6 L15.5 12 L9.5 18"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M5 5 L15 15 M15 5 L5 15"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
    />
  </svg>
)

export default function Lightbox({
  src,
  alt,
  onClose,
  onPrev,
  onNext,
  prevLabel,
  nextLabel,
  closeLabel,
}: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const prevRef = useRef<HTMLButtonElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowLeft') {
        onPrev()
      } else if (e.key === 'ArrowRight') {
        onNext()
      } else if (e.key === 'Tab') {
        // Simple focus trap among the three buttons
        const order = [prevRef.current, nextRef.current, closeRef.current].filter(
          Boolean,
        ) as HTMLButtonElement[]
        if (order.length === 0) return
        const active = document.activeElement as HTMLElement | null
        const currentIndex = active ? order.indexOf(active as HTMLButtonElement) : -1
        if (currentIndex === -1) {
          e.preventDefault()
          order[0].focus()
          return
        }
        const nextIndex = e.shiftKey
          ? (currentIndex - 1 + order.length) % order.length
          : (currentIndex + 1) % order.length
        e.preventDefault()
        order[nextIndex].focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose, onPrev, onNext])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="fixed inset-0 z-[60] bg-charcoal/[0.92] backdrop-blur-sm flex items-center justify-center animate-fade"
      onClick={onClose}
    >
      <button
        ref={prevRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onPrev()
        }}
        className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 rounded-full bg-charcoal text-ivory hover:bg-gold-ink focus-visible:outline-ivory p-3 transition-colors"
        aria-label={prevLabel}
      >
        <ChevronLeft />
      </button>

      <div
        className="relative w-full max-w-4xl mx-12 sm:mx-20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full aspect-[3/2] max-h-[80vh]">
          <Image
            src={`/gallery/${src}`}
            alt={alt}
            fill
            sizes="80vw"
            className="object-contain animate-fade"
            priority
          />
        </div>
      </div>

      <button
        ref={nextRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onNext()
        }}
        className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 rounded-full bg-charcoal text-ivory hover:bg-gold-ink focus-visible:outline-ivory p-3 transition-colors"
        aria-label={nextLabel}
      >
        <ChevronRight />
      </button>

      <button
        ref={closeRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 rounded-full bg-charcoal text-ivory hover:bg-gold-ink focus-visible:outline-ivory p-3 transition-colors"
        aria-label={closeLabel}
      >
        <CloseIcon />
      </button>
    </div>
  )
}
