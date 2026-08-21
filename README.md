# SAMPRE · Sistema de Gestión de Socios

Panel de administración de socios de la **Sociedad Argentina de Medicina Prehospitalaria (SAMPRE)**.
Permite gestionar socios, registrar pagos de cuota, ver un dashboard con métricas, exportar los
datos a Excel y enviar avisos automáticos de vencimiento de cuota por email.

## Stack

- **Next.js 15** (App Router) + **React 19** + **JSX**
- **Tailwind CSS** (misma paleta institucional que el landing de SAMPRE)
- **Supabase** (Postgres + Auth con cookies **httpOnly**)
- **Nodemailer** (Gmail SMTP) para los avisos
- **ExcelJS** para la exportación
- Deploy en **Vercel** (con Cron Job diario)

## Seguridad

- Autenticación con **Supabase Auth vía `@supabase/ssr`**: la sesión vive en **cookies `httpOnly`**, nunca en `localStorage`.
- **Vencimiento de sesión** gestionado por Supabase (JWT + refresh token) y revalidado en cada request por el middleware (`getUser()` valida contra el servidor, no confía en la cookie).
- **Middleware** que protege todas las rutas salvo `/login` y el endpoint de cron.
- **Rate limiting** durable en Postgres (función atómica `check_rate_limit`) sobre el login: 5 intentos por IP y por email cada 15 minutos.
- **RLS** (Row Level Security) en todas las tablas: solo usuarios autenticados leen/escriben socios y pagos. El acceso anónimo está bloqueado.
- El endpoint de cron está protegido con `CRON_SECRET`.
- El `service_role` key se usa **solo server-side** (rate limiter y cron).

## Estructura

```
socios/
├── app/
│   ├── layout.jsx                     # layout raíz
│   ├── login/                         # login (server action + rate limit)
│   ├── auth/actions.js                # logout
│   ├── (panel)/                       # rutas protegidas
│   │   ├── layout.jsx                 # NavBar + guard de sesión
│   │   ├── page.jsx                   # Dashboard (KPIs)
│   │   └── socios/
│   │       ├── page.jsx               # listado
│   │       ├── actions.js             # CRUD + pago + aviso
│   │       └── export/route.js        # exportar a Excel
│   └── api/cron/vencimientos/route.js # cron de avisos por email
├── components/                        # NavBar, modales, tabla
├── lib/
│   ├── supabase/                      # clientes server / admin / middleware
│   ├── prices.js  dates.js  stats.js  # lógica de negocio
│   ├── email.js   rate-limit.js
├── middleware.js                      # protección + refresh de sesión
└── vercel.json                        # Cron diario
```

## Variables de entorno

Copiá `.env.example` a `.env.local` y completá:

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable/anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Solo server**. Dashboard Supabase → Settings → API → `service_role`. Necesaria para el rate limiter y el cron. |
| `SMTP_HOST` / `SMTP_PORT` | `smtp.gmail.com` / `465` |
| `SMTP_USER` / `SMTP_PASS` | Email y **contraseña de aplicación** de Google |
| `SMTP_FROM` | Remitente, ej. `"SAMPRE Socios <sistemas@sampre.com.ar>"` |
| `CRON_SECRET` | String aleatorio largo para proteger el cron |
| `DIAS_AVISO_VENCIMIENTO` | Días de anticipación del aviso (default 7) |

### Gmail SMTP

1. Activá la verificación en dos pasos en la cuenta de Google.
2. Generá una **contraseña de aplicación**: https://myaccount.google.com/apppasswords
3. Usá ese valor (16 caracteres) en `SMTP_PASS`.

> Si usás un dominio propio (`@sampre.com.ar` con Google Workspace) funciona igual con la app password de esa cuenta.

## Desarrollo

```bash
npm install
npm run dev
```

App en http://localhost:3000

## Deploy en Vercel

1. Importá el repo en Vercel.
2. Cargá **todas** las variables de entorno (Production + Preview).
3. Deploy. El `vercel.json` ya configura el Cron diario (`0 12 * * *` UTC ≈ 09:00 ART) que llama a `/api/cron/vencimientos`.
   - Vercel envía automáticamente el header `Authorization: Bearer $CRON_SECRET`, así que el endpoint queda protegido.

## Base de datos

Esquema en Supabase (proyecto `cgldiotfwsygmxlbmyjs`):

- **`socios`** — datos del socio, categoría, período de pago, vencimiento, estado.
- **`pagos`** — historial de pagos (para la recaudación).
- **`rate_limits`** — soporte del rate limiter (sin acceso directo).

Precios de cuota (fuente: landing de SAMPRE):

| Categoría | Mensual | Anual |
|---|---|---|
| Activo | $8.000 | $60.000 |
| Titular | $10.000 | $80.000 |
| Fundador | Honorario (no paga) | — |

Los 73 socios del Excel original (`socios sampre 2026.xlsx`) ya fueron importados.

## Acceso

Usuario admin: **`sistemas@sampre.com.ar`**.
Se puede invitar a más administradores desde el dashboard de Supabase (Authentication → Users).
