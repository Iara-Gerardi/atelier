import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'atelier:styles'
import PreviewShell from './PreviewShell'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PreviewShell />
  </StrictMode>,
)
