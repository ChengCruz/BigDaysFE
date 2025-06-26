import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css"; // your Tailwind + @theme CSS
import { Toaster } from "react-hot-toast";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EventProvider } from "./context/EventContext.tsx";
const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <EventProvider>
        <App />
      </EventProvider>
      <Toaster position="top-right" />
    </QueryClientProvider>
  </StrictMode>
);
