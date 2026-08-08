import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { homeApi } from '../../api/home';
import WhatsappButton from '../../components/WhatsappButton';
import Logo from '../../components/Logo';
import SoundRings from '../../components/SoundRings';
import StringDivider from '../../components/StringDivider';
import { assetUrl } from '../../utils/assetUrl';
import PublicClassModal from '../../components/PublicClassModal';
import { InstagramIcon, FacebookIcon, WhatsappIcon } from '../../components/socialIcons';

const WHATSAPP_MESSAGE = 'Hola, quiero consultar sobre las clases de Academia Farhat';

function PinIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9.5" r="2.3" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function GraduateIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M2 8.5 12 4l10 4.5-10 4.5-10-4.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M6 10.7v4.3c0 1.4 2.7 2.8 6 2.8s6-1.4 6-2.8v-4.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M21 9v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TempoIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M7 20 15 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M17 20 9 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    </svg>
  );
}

function HeartIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 20s-7.5-4.6-9.8-9.1C.7 7.6 2.4 4.5 5.6 4c2-.3 3.9.7 4.9 2.3C11.5 4.7 13.4 3.7 15.4 4c3.2.5 4.9 3.6 3.4 6.9C16.5 15.4 12 20 12 20Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const REASONS = [
  {
    n: '01',
    icon: GraduateIcon,
    title: 'Profesores especializados',
    text: 'Cada instrumento lo dicta alguien formado específicamente en ese estilo y esa técnica.',
  },
  { n: '02', icon: ClockIcon, title: 'Horarios flexibles', text: 'Turnos durante toda la semana para acomodarnos a tu rutina, no al revés.' },
  { n: '03', icon: TempoIcon, title: 'Clases a tu ritmo', text: 'Primera vez con un instrumento o ya con experiencia: arrancamos desde donde estás.' },
  { n: '04', icon: HeartIcon, title: 'Ambiente cercano', text: 'Un lugar para disfrutar la música, sin presión y con acompañamiento real.' },
];

export default function Home() {
  const [content, setContent] = useState(null);
  const [selectedInstrument, setSelectedInstrument] = useState(null);

  useEffect(() => {
    homeApi.get().then(setContent).catch(() => setContent(null));
  }, []);

  const heroImage = content?.heroImages?.[0];
  const instruments = content?.publicInstruments || [];

  const scheduleByInstrument = (content?.schedule || []).reduce((groups, entry) => {
    const key = entry.instrumentName;
    groups[key] = groups[key] || [];
    entry.slots.forEach((s) => groups[key].push({ ...s, teacherName: entry.teacherName }));
    return groups;
  }, {});

  return (
    <div className="overflow-x-hidden bg-stage font-sans text-ivory">
      <nav className="sticky top-0 z-30 border-b border-ivory/10 bg-stage/90 backdrop-blur">
        <div className="container flex items-center justify-between py-4">
          <span className="flex items-center gap-2 font-display text-lg font-semibold text-ivory">
            <Logo className="h-8 w-8" />
            Academia Farhat
          </span>
          <div className="flex items-center gap-6">
            <a href="#instrumentos" className="hidden text-sm text-ivory/70 transition hover:text-gold sm:inline">
              Instrumentos
            </a>
            <a href="#contacto" className="hidden text-sm text-ivory/70 transition hover:text-gold sm:inline">
              Contacto
            </a>
            <Link to="/login" className="rounded-full border border-ivory/25 px-4 py-1.5 text-sm text-ivory transition hover:border-gold hover:text-gold">
              Ingresar
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="grain relative flex min-h-[90svh] items-center overflow-hidden">
        {heroImage && (
          <img
            src={assetUrl(heroImage)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-stage via-stage/75 to-stage/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-stage/70 via-transparent to-stage/20" />
        <SoundRings className="pointer-events-none absolute left-1/2 top-1/2 h-[220%] w-[220%] -translate-x-1/2 -translate-y-1/2 text-gold opacity-[0.08]" />

        <div className="container relative py-20">
          <div className="max-w-xl">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">Academia de música</span>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.05] text-ivory sm:text-6xl">
              Encontrá tu <span className="text-gold">sonido</span>
            </h1>
            <p className="mt-6 max-w-md text-lg text-ivory/70">
              Guitarra, canto, batería, teclado, violín, bajo y más. Clases pensadas para que aprendas a tu ritmo,
              con profesores que se dedican a esto de verdad.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <WhatsappButton phone={content?.whatsappNumber} message={WHATSAPP_MESSAGE} />
              <a href="#instrumentos" className="btn secondary !border-ivory/25 !text-ivory hover:!border-gold hover:!text-gold">
                Ver instrumentos
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-ivory/10 bg-walnut py-5">
        <div className="container flex flex-wrap justify-center gap-x-3 gap-y-2 text-center text-xs font-semibold uppercase tracking-widest text-ivory/60">
          {['Todos los niveles', 'Profesores especializados', 'Horarios flexibles', 'Clases grupales'].map((item, i, arr) => (
            <span key={item} className="flex items-center gap-3">
              <span className="cursor-default transition hover:text-gold">{item}</span>
              {i < arr.length - 1 && <span className="text-gold">&middot;</span>}
            </span>
          ))}
        </div>
      </section>

      {/* Instruments */}
      <section id="instrumentos" className="container py-24">
        <div className="mx-auto mb-4 max-w-xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">Nuestras clases</span>
          <h2 className="mt-4 font-display text-4xl font-semibold text-ivory sm:text-5xl">Elegí tu instrumento</h2>
        </div>
        <StringDivider className="mx-auto mb-14 h-4 w-40 text-gold/50" />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {instruments.map((instrument) => (
            <button
              key={instrument._id}
              type="button"
              onClick={() => setSelectedInstrument(instrument)}
              className="group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-2xl border border-ivory/10 bg-walnut text-left transition duration-300 will-change-transform hover:scale-[1.04] hover:border-gold/50 hover:shadow-xl hover:shadow-stage/50 focus-visible:border-gold"
            >
              {instrument.images?.[0] ? (
                <>
                  <img
                    src={assetUrl(instrument.images[0])}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-xl"
                  />
                  <img
                    src={assetUrl(instrument.images[0])}
                    alt={instrument.name}
                    className="absolute inset-0 h-full w-full object-contain saturate-[0.85] transition duration-500 group-hover:scale-105 group-hover:saturate-100"
                  />
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Logo className="h-10 w-10 opacity-40" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-stage via-stage/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <div className="mb-2 h-0.5 w-8 bg-gold" />
                <h3 className="font-display text-xl font-semibold text-ivory">{instrument.name}</h3>
                {instrument.description && (
                  <p className="mt-1 max-h-0 overflow-hidden text-sm text-ivory/70 opacity-0 transition-all duration-300 group-hover:max-h-24 group-hover:opacity-100">
                    {instrument.description}
                  </p>
                )}
              </div>
            </button>
          ))}
          {instruments.length === 0 && (
            <p className="col-span-full text-center text-ivory/60">Próximamente vamos a mostrar acá nuestros instrumentos.</p>
          )}
        </div>
      </section>


      {/* Why choose us */}
      <section className="border-t border-ivory/10 py-24">
        <div className="container">
          <div className="mb-14 max-w-xl">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">¿Por qué elegir Academia Farhat?</span>
            <h2 className="mt-4 font-display text-4xl font-semibold text-ivory sm:text-5xl">Así son nuestras clases</h2>
            <StringDivider className="mt-6 h-4 w-32 text-gold/50" />
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {REASONS.map((reason) => {
              const Icon = reason.icon;
              return (
                <div
                  key={reason.n}
                  className="group relative overflow-hidden rounded-2xl border border-ivory/10 bg-walnut p-6 transition duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:border-gold/40 hover:shadow-xl hover:shadow-stage/50"
                >
                  <span className="pointer-events-none absolute -right-3 -top-8 select-none font-display text-8xl font-bold text-ivory/[0.04]">
                    {reason.n}
                  </span>
                  <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gold/15 text-gold transition group-hover:bg-gold group-hover:text-ink">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="relative mt-4 font-display text-lg font-semibold text-ivory">{reason.title}</h3>
                  <p className="relative mt-2 text-sm text-ivory/60">{reason.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Location / contact */}
      <section id="contacto" className="container pb-24">
        <div className="grain relative overflow-hidden rounded-3xl border border-gold/25 bg-walnut px-8 py-10 sm:px-12">
          <span className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-gold to-transparent" />
          <SoundRings className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 text-gold/10" />

          <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="text-center md:text-left">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">Visitanos</span>
              <h2 className="mt-2 font-display text-3xl font-semibold text-ivory sm:text-4xl">Ubicación y contacto</h2>

              <div className="mt-5 flex items-center justify-center gap-3 md:justify-start">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold">
                  <PinIcon className="h-5 w-5" />
                </span>
                <p className="font-display text-lg font-semibold text-ivory sm:text-xl">
                  {content?.address || 'A confirmar'}
                </p>
              </div>
            </div>

            <div className="shrink-0 border-t border-ivory/10 pt-8 text-center md:border-t-0 md:border-l md:pl-10 md:pt-0 md:text-left">
              <span className="text-xs font-semibold uppercase tracking-wide text-ivory/40">Seguinos y escribinos</span>
              <div className="mt-4 flex justify-center gap-4 md:justify-start">
                {content?.instagram && (
                  <a
                    href={content.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-gold text-ink shadow-lg shadow-stage/40 transition hover:-translate-y-1 hover:bg-gold-dark"
                  >
                    <InstagramIcon className="h-6 w-6" />
                  </a>
                )}
                {content?.facebook && (
                  <a
                    href={content.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-gold text-ink shadow-lg shadow-stage/40 transition hover:-translate-y-1 hover:bg-gold-dark"
                  >
                    <FacebookIcon className="h-6 w-6" />
                  </a>
                )}
                {content?.whatsappNumber && (
                  <a
                    href={`https://wa.me/${content.whatsappNumber.replace(/[^\d]/g, '')}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp"
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-gold text-ink shadow-lg shadow-stage/40 transition hover:-translate-y-1 hover:bg-gold-dark"
                  >
                    <WhatsappIcon className="h-6 w-6" />
                  </a>
                )}
                {!content?.instagram && !content?.facebook && !content?.whatsappNumber && (
                  <p className="text-sm text-ivory/50">Próximamente más formas de contactarnos.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-ivory/10 bg-walnut py-10 text-center">
        <Logo className="mx-auto mb-3 h-8 w-8 opacity-70" />
        <p className="text-sm text-ivory/50">&copy; {new Date().getFullYear()} Academia Farhat</p>
      </footer>

      <WhatsappButton phone={content?.whatsappNumber} message={WHATSAPP_MESSAGE} floating />

      <PublicClassModal
        instrument={selectedInstrument}
        schedule={selectedInstrument ? scheduleByInstrument[selectedInstrument.name] : []}
        whatsappNumber={content?.whatsappNumber}
        onClose={() => setSelectedInstrument(null)}
      />
    </div>
  );
}
