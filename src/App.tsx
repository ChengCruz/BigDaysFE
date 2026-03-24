import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthProvider";
import { EventProvider } from "./context/EventContext";
import Routes from "./routers/routes";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <EventProvider>
          <BrowserRouter>
            <Routes />
          </BrowserRouter>
        </EventProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
