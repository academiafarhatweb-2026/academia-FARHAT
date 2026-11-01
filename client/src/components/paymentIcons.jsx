// Generic line icons per payment method (no third-party brand logos).
const PATHS = {
  cash: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6 9.5v5M18 9.5v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  transfer: (
    <>
      <path d="M4 8.5h14l-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 15.5H6l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  debit: (
    <>
      <rect x="2.5" y="5.5" width="19" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M2.5 9.5h19" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6 15h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  credit: (
    <>
      <rect x="2.5" y="5.5" width="19" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="5.5" y="9" width="4" height="3" rx="0.6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M13 15h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  interest_free_installments: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8 14h2M12 14h2M8 17h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  mercado_pago: (
    <>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <rect x="4" y="8" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="16" cy="13.5" r="1.3" fill="currentColor" />
    </>
  ),
};

export function PaymentMethodIcon({ method, className }) {
  const paths = PATHS[method];
  if (!paths) return null;
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      {paths}
    </svg>
  );
}
