import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// StrictMode omitted — double-invocation would re-initialize the FFmpeg singleton
createRoot(document.getElementById('root')).render(<App />)
