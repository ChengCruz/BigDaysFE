// src/context/UserContext.tsx
import { createContext, useContext } from "react";
// import type { ReactNode } from "react";
// import { useMe } from "../api/hooks/useMeApi";

interface UserCtx {
  user: { id: string; name: string; email: string } | null;
  loading: boolean;
  error: unknown;
}

const UserContext = createContext<UserCtx>({
  user: null,
  loading: false,
  error: null,
});
export const useUser = () => useContext(UserContext);

// export function UserProvider({ children }: { children: ReactNode }) {
//   const { data, isLoading, error } = useMe();

//   return (
//     <UserContext.Provider
//       value={{ user: data ?? null, loading: isLoading, error }}
//     >
//       {children}
//     </UserContext.Provider>
//   );
// }
