// Redrawn from the academy's mark: two concentric gold rings (sound waves) around a
// pale eighth note. Swap for the original vector file if/when it's available as an asset.
export default function Logo({ className }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <circle cx="50" cy="50" r="42" fill="none" stroke="#F0B429" strokeWidth="8" strokeLinecap="round" strokeDasharray="230 30" strokeDashoffset="-15" />
      <circle cx="50" cy="50" r="28" fill="none" stroke="#F0B429" strokeWidth="8" strokeLinecap="round" strokeDasharray="150 25" strokeDashoffset="-10" />
      <rect x="53" y="30" width="6" height="34" rx="3" fill="#F6EEE0" />
      <path d="M59 30 L72 26 V38 L59 42 Z" fill="#F6EEE0" />
      <circle cx="50" cy="64" r="9" fill="#F6EEE0" />
    </svg>
  );
}
