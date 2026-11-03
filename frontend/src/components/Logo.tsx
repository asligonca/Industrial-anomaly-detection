/** SAURON göz işareti (tasarımdan). */
export function Logo({ size = 44 }: { size?: number }) {
  return (
    <div
      className="grid place-items-center bg-zinc-900"
      style={{ width: size, height: size, borderRadius: size * 0.27 }}
    >
      <svg width={size * 0.64} height={size * 0.64} viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="10.2" stroke="#fff" strokeWidth="1.4" />
        <circle cx="12" cy="12" r="6.6" stroke="#fff" strokeWidth="1.4" opacity="0.65" />
        <circle cx="12" cy="12" r="3.2" fill="#fff" />
        <circle cx="13.3" cy="10.7" r="1" fill="#18181b" />
      </svg>
    </div>
  )
}
