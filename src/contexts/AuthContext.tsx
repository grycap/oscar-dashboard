//auth context with user, password, and endpoint
import { setAxiosInterceptor } from "@/lib/axiosClient";
import React, { createContext, useContext, useMemo, useState } from "react";

export type AuthData = {
  user: string;
  password: string;
  endpoint: string;
  authenticated?: boolean;
};

export const AuthContext = createContext({
  authData: {
    user: "",
    password: "",
    endpoint: "",
    authenticated: false,
  } as AuthData,
  setAuthData: (_: AuthData) => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const initialData = useMemo(() => {
    const storedData = localStorage.getItem("authData");
    if (!storedData) {
      return {
        user: "",
        password: "",
        endpoint: "",
        authenticated: false,
      } as AuthData;
    }

    const parsedData = JSON.parse(storedData) as AuthData;

    setAxiosInterceptor(parsedData);

    return parsedData;
  }, []);

  const [authData, setAuthDataState] = useState(initialData);

  function setAuthData(data: AuthData) {
    localStorage.setItem("authData", JSON.stringify(data));

    setAxiosInterceptor(data);

    setAuthDataState(data);
  }

  return (
    <AuthContext.Provider
      value={{
        authData,
        setAuthData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
