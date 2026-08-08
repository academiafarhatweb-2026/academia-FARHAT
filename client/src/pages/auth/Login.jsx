import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../../store/authStore';
import { homeApi } from '../../api/home';
import { assetUrl } from '../../utils/assetUrl';
import Logo from '../../components/Logo';
import { adminLoginSchema, studentLoginSchema } from '../../schemas';

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
        <input id="adminPassword" type="password" {...register('password')} />
        {errors.password && <p className="error">{errors.password.message}</p>}
      </div>
      {errors.root && <p className="error">{errors.root.message}</p>}
      <button className="btn" type="submit" disabled={loading} style={{ width: '100%' }}>
        {loading ? 'Ingresando...' : 'Ingresar'}
      </button>
    </form>
  );
}
