import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App"
import { PreferencesProvider } from "./contexts/PreferencesContext"
import { I18nProvider } from "./contexts/I18nContext"
import "./styles.css"

const rootElement = document.getElementById("root")

if (!rootElement) {
  throw new Error("Root element was not found")
}

createRoot(rootElement).render(
  <StrictMode>
    <PreferencesProvider>
      <I18nProvider>
        <App />
      </I18nProvider>
    </PreferencesProvider>
  </StrictMode>,
)

