import { BrowserRouter } from "react-router";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthProvider";
import { UiModeProvider } from "./context/UiModeContext";
import { EventProvider } from "./context/EventContext";
import Routes from "./routers/routes";
import { GoogleAnalytics } from "./components/analytics/GoogleAnalytics";
import { CookieConsentBanner } from "./components/organisms/CookieConsentBanner";
import ScrollToTop from "./components/ScrollToTop";
import MaintenanceScreen from "./components/organisms/MaintenanceScreen";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        {/* Inside AuthProvider: the default mode is derived from the user's role. */}
        <UiModeProvider>
          <EventProvider>
            <BrowserRouter>
              <GoogleAnalytics />
              <ScrollToTop />
              <Routes />
              <CookieConsentBanner />
              <MaintenanceScreen />
            </BrowserRouter>
          </EventProvider>
        </UiModeProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
