//auth context with user, password, and endpoint
import axios from "axios";
import React, { createContext, useState } from "react";

type AuthData = {
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
  const storedData = localStorage.getItem("authData");
  const initialData = storedData
    ? JSON.parse(storedData)
    : {
        user: "",
        password: "",
        endpoint: "",
        authenticated: false,
      };

  const [authData, setAuthDataState] = useState(initialData);

  function setAuthData(data: AuthData) {
    localStorage.setItem("authData", JSON.stringify(data));

    const { endpoint, user: username, password } = data;
    axios.interceptors.request.use((config) => {
      config.baseURL = endpoint;
      config.auth = {
        username,
        password,
      };
      return config;
    });

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
