import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/app/globals.css'
import PreviewShell from './PreviewShell'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PreviewShell />
  </StrictMode>,
)
