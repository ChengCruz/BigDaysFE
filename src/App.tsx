import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthProvider";
import { EventProvider } from "./context/EventContext";
import Routes from "./routers/routes";
import { GoogleAnalytics } from "./components/analytics/GoogleAnalytics";
import ScrollToTop from "./components/ScrollToTop";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <EventProvider>
          <BrowserRouter>
            <GoogleAnalytics />
            <ScrollToTop />
            <Routes />
          </BrowserRouter>
        </EventProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
