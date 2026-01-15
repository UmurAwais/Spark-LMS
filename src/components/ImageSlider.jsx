import React, { useState, useEffect, useRef } from 'react'

// A Udemy-like responsive image slider using Tailwind CSS.
// - Uses external Unsplash images for demo (replace with local assets if you prefer)
// - Full-width container is controlled by the outer max-w-[1440px] in App.jsx
// - Desktop height ~420px, tablet ~320px, mobile ~220px (adjustable via classes)

const images = [
  'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?auto=format&fit=crop&w=1440&q=80',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1440&q=80',
  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1440&q=80'
]

const ImageSlider = ({ autoplay = true, interval = 5000 }) => {
  const [index, setIndex] = useState(0)
  const length = images.length
  const timerRef = useRef(null)
  const containerRef = useRef(null)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  useEffect(() => {
    if (!autoplay) return
    startTimer()
    return () => stopTimer()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, autoplay])

  const startTimer = () => {
    stopTimer()
    timerRef.current = setTimeout(() => {
      setIndex((i) => (i + 1) % length)
    }, interval)
  }

  const stopTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const goTo = (i) => {
    setIndex(i % length)
  }

  const prev = () => {
    setIndex((i) => (i - 1 + length) % length)
  }

  const next = () => {
    setIndex((i) => (i + 1) % length)
  }

  // Touch handlers for swipe
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }
  const onTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX
  }
  const onTouchEnd = () => {
    const delta = touchStartX.current - touchEndX.current
    if (Math.abs(delta) > 50) {
      if (delta > 0) next()
      else prev()
    }
    touchStartX.current = 0
    touchEndX.current = 0
  }

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="relative overflow-hidden bg-gray-100"
        onMouseEnter={stopTimer}
        onMouseLeave={() => autoplay && startTimer()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        aria-roledescription="carousel"
      >
        {/* Slides wrapper: flex with transform based on index (horizontal slide) */}
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ width: `${length * 100}%`, transform: `translateX(-${(index / length) * 100}%)` }}
        >
          {images.map((src, i) => (
            <div
              key={src}
              className="relative shrink-0"
              style={{ width: `${100 / length}%` }}
            >
              {/* Image with object-cover to fill area */}
              <div className="h-[220px] sm:h-80 lg:h-[420px] w-full">
                <img src={src} alt={`Slide ${i + 1}`} className="w-full h-full object-cover" />
              </div>

              {/* content box removed — slides intentionally image-only */}
            </div>
          ))}
        </div>

        {/* Arrows (desktop visible) */}
        <button
          onClick={prev}
          aria-label="Previous slide"
          className="hidden md:flex items-center justify-center absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-md text-gray-700 hover:bg-gray-100 z-30 cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 16L6 10L12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <button
          onClick={next}
          aria-label="Next slide"
          className="hidden md:flex items-center justify-center absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-md text-gray-700 hover:bg-gray-100 z-30 cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 4L14 10L8 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Dots */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-4 z-30 flex items-center gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${i === index ? 'bg-white w-8 h-2 rounded-full shadow' : 'bg-white/60 hover:bg-white w-2 h-2'}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default ImageSlider