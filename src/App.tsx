import { BrowserRouter } from "react-router";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthProvider";
import { UiModeProvider } from "./context/UiModeContext";
import { EventProvider } from "./context/EventContext";
import Routes from "./routers/routes";
import { GoogleAnalytics } from "./components/analytics/GoogleAnalytics";
import ScrollToTop from "./components/ScrollToTop";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        {/* Inside AuthProvider — the default mode is derived from the user's role. */}
        <UiModeProvider>
          <EventProvider>
            <BrowserRouter>
              <GoogleAnalytics />
              <ScrollToTop />
              <Routes />
            </BrowserRouter>
          </EventProvider>
        </UiModeProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
