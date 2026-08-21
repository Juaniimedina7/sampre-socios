import './globals.css'

export const metadata = {
  title: 'SAMPRE · Gestión de Socios',
  description: 'Panel de administración de socios de la Sociedad Argentina de Medicina Prehospitalaria',
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
