//auth context with user, password, and endpoint
import React, { createContext, useState } from "react";

type AuthData = {
  user: string;
  password: string;
  endpoint: string;
};

export const AuthContext = createContext({
  authData: {
    user: "",
    password: "",
    endpoint: "",
  },
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
      };

  const [authData, setAuthDataState] = useState(initialData);

  function setAuthData(data: AuthData) {
    localStorage.setItem("authData", JSON.stringify(data));

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
