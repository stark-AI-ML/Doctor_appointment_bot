import { useState } from 'react'

/**
 * Hospital logo — uses the real brand image at public/image/image.png.
 * Falls back to the inline SVG mark if the image can't load.
 */
function SvgFallback({ height }) {
  return (
    <svg
      width={height * 1.3}
      height={height}
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
      aria-hidden
    >
      <path d="M100 240C90 190 120 120 170 40C120 80 80 130 90 240Z" fill="#009BDD" />
      <path d="M130 220C120 180 150 130 180 80C140 120 110 160 120 220Z" fill="#009BDD" />
      <path
        d="M210 32C240 32 270 50 270 90C290 80 320 80 340 105C360 130 350 160 340 180C360 205 350 240 320 255C290 270 245 275 200 290C220 270 250 250 250 215C250 170 200 180 200 135C200 100 240 110 240 90C240 75 220 50 200 40C202 36 205 32 210 32Z"
        fill="#7BC142"
      />
      <g transform="translate(70, 200) scale(0.6)">
        <rect x="58" y="20" width="4" height="110" fill="#F37023" rx="2" />
        <circle cx="60" cy="18" r="6" fill="#F37023" />
        <path d="M60 40C40 25 15 35 10 45C30 45 45 42 60 55C75 42 90 45 110 45C105 35 80 25 60 40Z" fill="#009BDD" />
        <path d="M60 50 C40 60 40 75 60 85 C80 95 80 110 60 120" stroke="#7BC142" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M60 50 C80 60 80 75 60 85 C40 95 40 110 60 120" stroke="#7BC142" strokeWidth="6" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  )
}

export function HospitalLogo({ height = 50, className = '' }) {
  const [failed, setFailed] = useState(false)

  if (failed) return <SvgFallback height={height} />

  return (
    <img
      src="/image/image.png"
      alt="KG Nanda Hospital"
      height={height}
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', objectFit: 'contain' }}
      onError={() => setFailed(true)}
    />
  )
}

export default HospitalLogo
