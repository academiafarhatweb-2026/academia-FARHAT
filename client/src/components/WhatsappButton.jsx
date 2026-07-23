import { WhatsappIcon } from './socialIcons';

export default function WhatsappButton({ phone, message, floating, variant }) {
  if (!phone) return null;

  const cleanPhone = phone.replace(/[^\d]/g, '');
  const text = encodeURIComponent(message || 'Hola, quiero consultar sobre las clases.');
  const href = `https://wa.me/${cleanPhone}?text=${text}`;

  const baseClass = floating ? 'whatsapp-fab' : 'whatsapp-button';
  const className = variant === 'onGold' ? `${baseClass} !bg-stage !text-gold hover:!bg-stage-light` : baseClass;

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      <WhatsappIcon className="h-4 w-4" />
      Escribinos
    </a>
  );
}
