import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from '@/App'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import '@/index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
          <Toaster
            position="top-right"
            gutter={12}
            toastOptions={{
              duration: 4200,
              style: {
                borderRadius: 0,
                border: '1px solid var(--color-hairline-strong)',
                background: 'var(--color-canvas)',
                color: 'var(--color-body)',
                fontSize: '14px',
                fontWeight: 300,
                boxShadow: 'none',
              },
              success: { style: { borderLeft: '2px solid var(--color-success)' } },
              error: { style: { borderLeft: '2px solid var(--color-error)' } },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
