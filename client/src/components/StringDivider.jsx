// A guitar string mid-pluck, used as a section divider instead of a plain hairline.
export default function StringDivider({ className }) {
  return (
    <svg viewBox="0 0 400 24" preserveAspectRatio="none" className={className} aria-hidden="true">
      <path
        d="M0 12 H160 C182 12 182 3 200 3 C218 3 218 12 240 12 H400"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
