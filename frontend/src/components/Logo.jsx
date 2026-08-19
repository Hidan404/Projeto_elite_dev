export default function Logo({ claro = false }) {
  const ticket = claro ? '#e8b45f' : '#d97706'
  const furo = claro ? '#2e2013' : '#faf6ef'
  return (
    <>
      <svg width="26" height="26" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <rect x="4" y="10" width="40" height="28" rx="5" fill={ticket} />
        <circle cx="12" cy="24" r="3.2" fill={furo} />
        <circle cx="20" cy="24" r="3.2" fill={furo} />
        <circle cx="28" cy="24" r="3.2" fill={furo} />
        <circle cx="36" cy="24" r="3.2" fill={furo} />
        <path d="M4 15h40v4H4z" fill={furo} opacity="0.35" />
      </svg>
      {claro ? <span style={{ color: '#fffdf9' }}>Cine<span style={{ color: '#e8b45f' }}>Elite</span></span> : <>Cine<span>Elite</span></>}
    </>
  )
}