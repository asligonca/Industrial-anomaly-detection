/** SENTRA endüstriyel sinyal işareti. */
export function Logo({ size = 44 }: { size?: number }) {
  return (
    <div
      className="grid place-items-center rounded-xl bg-zinc-900"
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.68} height={size * 0.68} viewBox="0 0 32 32" fill="none" aria-hidden>
        <path
          d="M16 3.5 27 9.75v12.5L16 28.5 5 22.25V9.75L16 3.5Z"
          stroke="white"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="M8.5 16h4l2.2-5 3.1 10 2.1-5h3.6"
          stroke="#fbbf24"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="8.5" cy="16" r="1.25" fill="white" />
        <circle cx="23.5" cy="16" r="1.25" fill="white" />
      </svg>
    </div>
  )
}
