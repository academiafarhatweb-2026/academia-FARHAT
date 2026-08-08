import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../../store/authStore';
import { homeApi } from '../../api/home';
import { assetUrl } from '../../utils/assetUrl';
import Logo from '../../components/Logo';
import { adminLoginSchema, studentLoginSchema } from '../../schemas';

function EyeIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function EyeOffIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M3 3l18 18M10.6 5.1C11.05 5.04 11.51 5 12 5c7 0 10.5 7 10.5 7-.6 1.2-1.66 2.87-3.24 4.32M6.6 6.6C3.86 8.4 1.5 12 1.5 12s3.5 7 10.5 7c1.62 0 3.02-.37 4.22-.94"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.9 9.9a3 3 0 0 0 4.2 4.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Login() {
  const [mode, setMode] = useState('student'); // 'student' | 'admin'
  const [heroImage, setHeroImage] = useState(null);

  useEffect(() => {
    homeApi.get().then((content) => setHeroImage(content?.heroImages?.[0] || null)).catch(() => setHeroImage(null));
  }, []);

  return (
    <div className="grain relative flex min-h-svh items-center justify-center overflow-hidden bg-stage px-5 py-16">
      {heroImage && (
        <img src={assetUrl(heroImage)} alt="" className="absolute inset-0 h-full w-full scale-125 object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-stage/55 via-stage/70 to-stage" />

      <div className="relative w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2 font-display text-lg font-semibold text-ivory">
          <Logo className="h-9 w-9" />
          Academia Farhat
        </Link>

        <div className="rounded-3xl border border-gold/20 bg-ivory/95 p-8 shadow-2xl shadow-stage/50 backdrop-blur">
          <h1 className="text-center font-display text-3xl font-bold text-ink">Ingresar</h1>

          <div className="mt-6 flex justify-center gap-1 border-b border-ink/10">
            <button
              type="button"
              className={`-mb-px cursor-pointer rounded-t-lg border-b-2 px-4 py-2 text-sm font-medium transition ${
                mode === 'student' ? 'border-gold text-ink' : 'border-transparent text-ink/60 hover:text-ink'
              }`}
              onClick={() => setMode('student')}
            >
              Soy alumno
            </button>
            <button
              type="button"
              className={`-mb-px cursor-pointer rounded-t-lg border-b-2 px-4 py-2 text-sm font-medium transition ${
                mode === 'admin' ? 'border-gold text-ink' : 'border-transparent text-ink/60 hover:text-ink'
              }`}
              onClick={() => setMode('admin')}
            >
              Soy administrador
            </button>
          </div>

          <div className="pt-6">{mode === 'student' ? <StudentLoginForm /> : <AdminLoginForm />}</div>
        </div>

        <p className="mt-6 text-center">
          <Link to="/" className="text-sm text-ivory/70 transition hover:text-gold">
            Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  );
}

function StudentLoginForm() {
  const loginStudent = useAuthStore((s) => s.loginStudent);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(studentLoginSchema), defaultValues: { email: '' } });

  async function onValid(data) {
    setLoading(true);
    try {
      await loginStudent(data.email.trim());
      navigate('/student');
    } catch (err) {
      setError('root', { message: err.response?.data?.message || 'No se pudo iniciar sesión' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate>
      <div className="field">
        <label htmlFor="studentEmail">Tu email</label>
        <input id="studentEmail" type="email" {...register('email')} />
        {errors.email && <p className="error">{errors.email.message}</p>}
      </div>
      {errors.root && <p className="error">{errors.root.message}</p>}
      <button className="btn" type="submit" disabled={loading} style={{ width: '100%' }}>
        {loading ? 'Ingresando...' : 'Ingresar'}
      </button>
    </form>
  );
}

function AdminLoginForm() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(adminLoginSchema), defaultValues: { email: '', password: '' } });

  async function onValid(data) {
    setLoading(true);
    try {
      await login(data.email.trim(), data.password);
      navigate('/admin');
    } catch (err) {
      setError('root', { message: err.response?.data?.message || 'No se pudo iniciar sesión' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate>
      <div className="field">
        <label htmlFor="adminEmail">Email</label>
        <input id="adminEmail" type="email" {...register('email')} />
        {errors.email && <p className="error">{errors.email.message}</p>}
      </div>
      <div className="field">
        <label htmlFor="adminPassword">Contraseña</label>
        <div className="relative">
          <input
            id="adminPassword"
            type={showPassword ? 'text' : 'password'}
            className="w-full pr-10"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-ink/40 transition hover:text-ink"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? <EyeOffIcon className="h-4.5 w-4.5" /> : <EyeIcon className="h-4.5 w-4.5" />}
          </button>
        </div>
        {errors.password && <p className="error">{errors.password.message}</p>}
      </div>
      {errors.root && <p className="error">{errors.root.message}</p>}
      <button className="btn" type="submit" disabled={loading} style={{ width: '100%' }}>
        {loading ? 'Ingresando...' : 'Ingresar'}
      </button>
    </form>
  );
}
