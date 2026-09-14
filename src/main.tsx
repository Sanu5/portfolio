import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import './styles/global.css'
import App from './App'

// No StrictMode: its double-mount tears down the R3F root mid-configure and GSAP/Lenis singletons don't like being set up twice.
createRoot(document.getElementById('root')!).render(<App />)
