import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthProvider";
import { UserProvider }  from "./context/UserContext";
import Routes from "./routers/routes";

function App() {
  return (
    <ThemeProvider >
      <AuthProvider>
        <UserProvider>
          <BrowserRouter>
            <Routes />
          </BrowserRouter>
        </UserProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
