import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ShopProvider } from './context/ShopContext.jsx'
import { ChatProvider } from './context/ChatContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ShopProvider>
      <ChatProvider>
        <App />
      </ChatProvider>
    </ShopProvider>
  </StrictMode>,
)
