import { ColorSchemeScript, MantineProvider, createTheme } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { AuthProvider } from '../context/AuthContext'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import '@mantine/dates/styles.css'
import './globals.css'

const theme = createTheme({
  primaryColor: 'brand',
  colors: {
    brand: [
      '#e6faf9',
      '#d0f5f2',
      '#a1ece5',
      '#6de0d8',
      '#3dd4ca',
      '#0fbfb0',
      '#0aada0',
      '#088d82',
      '#066d64',
      '#044d47',
    ],
  },
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  fontFamilyMonospace: 'ui-monospace, SFMono-Regular, monospace',
  headings: { fontFamily: 'Inter, system-ui, sans-serif', fontWeight: '700' },
  defaultRadius: 'md',
  components: {
    Button: {
      styles: { root: { fontWeight: 600, letterSpacing: '-0.01em' } },
    },
    Card: {
      defaultProps: { shadow: 'sm', withBorder: true },
      styles: { root: { borderColor: 'rgba(15,31,61,0.07)' } },
    },
    Paper: {
      styles: { root: { borderColor: 'rgba(15,31,61,0.07)' } },
    },
    Modal: {
      styles: { content: { borderRadius: 16 }, header: { borderBottom: '1px solid rgba(15,31,61,0.06)' } },
    },
    Drawer: {
      styles: { content: { borderLeft: '1px solid rgba(15,31,61,0.07)' } },
    },
  },
})

export const metadata = {
  title: 'HabitApp',
  description: 'HabitApp — Administración de Condominios',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <ColorSchemeScript />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <MantineProvider theme={theme}>
          <Notifications position="top-right" zIndex={9999} />
          <AuthProvider>
            {children}
          </AuthProvider>
        </MantineProvider>
      </body>
    </html>
  )
}
