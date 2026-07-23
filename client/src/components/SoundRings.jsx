// Decorative signature motif: faint concentric rings echoing the logo's sound waves.
// Meant as a large, quiet background element (e.g. behind a hero headline) — set
// `color` via the parent's text color and control intensity with opacity classes.
export default function SoundRings({ className }) {
  return (
    <svg viewBox="0 0 400 400" className={className} fill="none" aria-hidden="true">
      <circle cx="200" cy="200" r="180" stroke="currentColor" strokeWidth="1" />
      <circle cx="200" cy="200" r="130" stroke="currentColor" strokeWidth="1" />
      <circle cx="200" cy="200" r="80" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
