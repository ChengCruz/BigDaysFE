import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthProvider";
import { EventProvider } from "./context/EventContext";
import Routes from "./routers/routes";
import { GoogleAnalytics } from "./components/analytics/GoogleAnalytics";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <EventProvider>
          <BrowserRouter>
            <GoogleAnalytics />
            <Routes />
          </BrowserRouter>
        </EventProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
