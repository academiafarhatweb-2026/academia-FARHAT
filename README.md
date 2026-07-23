# Academia Farhat

Sistema web para la gestión integral de la academia de música: landing page pública, portal de alumnos (sin contraseña) y panel de administración completo (alumnos, profesores, clases, inscripciones, pagos y liquidaciones).

## Stack

- **Cliente**: React + Vite, Tailwind CSS v4, Zustand, React Router.
- **Servidor**: Node.js + Express, MongoDB (Mongoose), JWT + cookies httpOnly.
- **Imágenes**: Cloudinary.

## Estructura

```
client/   # Frontend (React + Vite)
server/   # Backend (Express + MongoDB)
```

No es un monorepo con dependencias compartidas: `client` usa ESM y `server` usa CommonJS, cada uno con su propio `package.json`.

## Requisitos

- Node.js 18+
- Una base de datos MongoDB (local o Atlas)
- Una cuenta de Cloudinary (para la carga de imágenes)

## Configuración

### 1. Backend

```bash
cd server
npm install
cp .env.example .env
```

Completar `.env` con los valores reales:

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (default `4000`) |
| `MONGODB_URI` | Cadena de conexión a MongoDB |
| `JWT_SECRET` | Secreto para firmar los tokens de sesión |
| `CLIENT_ORIGIN` | URL del frontend, para CORS (`http://localhost:5173` en desarrollo) |
| `EXPIRATION_WARNING_DAYS` | Días de anticipación para avisar vencimientos próximos |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Credenciales del admin creado por el script de seed |
| `CLOUDINARY_URL` | Credenciales de Cloudinary (`cloudinary://<api_key>:<api_secret>@<cloud_name>`) |

Crear el usuario administrador inicial:

```bash
npm run seed
```

Levantar el servidor:

```bash
npm run dev
```

### 2. Frontend

```bash
cd client
npm install
npm run dev
```

La app queda disponible en `http://localhost:5173` y el backend en `http://localhost:4000`.

## Scripts disponibles

**server**
- `npm run dev` — servidor con recarga automática (nodemon)
- `npm start` — servidor en modo producción
- `npm run seed` — crea el usuario administrador
- `npm run seed:data` — carga datos reales iniciales (instrumentos, profesores, planes, horarios)

**client**
- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción
- `npm run lint` — linter (oxlint)
- `npm run preview` — sirve el build de producción localmente

## Roles y acceso

- **Administrador**: ingresa con email y contraseña en `/login`. Accede a todo el panel en `/admin`.
- **Alumno**: ingresa solo con su email (sin contraseña) en `/login`. Ve sus clases, vencimientos y estado de pago en `/student`.

## Funcionalidad principal

- Landing pública con catálogo de instrumentos, horarios y contacto (editable desde el panel).
- CRUD completo de alumnos, profesores, instrumentos, planes y clases fijas.
- Inscripciones con clases, plan y valor personalizado opcional.
- Registro de pagos con generación automática de recibo y cálculo de próximas clases/vencimiento.
- Vencimiento automático: una inscripción sin pago pasa a "de baja" sola, y vuelve a activarse al registrar un nuevo pago.
- Liquidación de profesores por período, generada automáticamente a partir de los pagos reales, con posibilidad de ajustar montos a mano.
- Calendario visual semanal de clases con gestión de alumnos por clase.
