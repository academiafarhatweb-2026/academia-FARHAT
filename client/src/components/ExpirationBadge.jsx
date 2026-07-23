const LABELS = {
  active: { text: 'Activo', className: 'badge badge-active' },
  expiring_soon: { text: 'Por vencer', className: 'badge badge-warning' },
  expired: { text: 'Vencido', className: 'badge badge-expired' },
  no_payment: { text: 'Sin pagos', className: 'badge badge-neutral' },
};

export default function ExpirationBadge({ status }) {
  const info = LABELS[status] || LABELS.no_payment;
  return <span className={info.className}>{info.text}</span>;
}
