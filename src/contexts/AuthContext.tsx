import getSystemConfigApi from "@/api/config/getSystemConfig";
import { getInfoApi } from "@/api/info/getInfoApi";
import { setAxiosInterceptor } from "@/lib/axiosClient";
import { SystemConfig } from "@/models/systemConfig";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type AuthData = {
  user: string;
  password: string;
  endpoint: string;
  token: string | undefined;
  authenticated?: boolean;
};

export const AuthContext = createContext({
  authData: {
    user: "",
    password: "",
    endpoint: "",
    authenticated: false,
  } as AuthData,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setAuthData: (_: AuthData) => {},
  systemConfig: null as SystemConfig | null,
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
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);

  async function handleGetSystemConfig() {
    if (!authData.authenticated) return;

    const response = await getSystemConfigApi();
    setSystemConfig(response);
  }

  useEffect(() => {
    handleGetSystemConfig();
  }, [authData]);

  function setAuthData(data: AuthData) {
    if (data.authenticated) {
      localStorage.setItem("authData", JSON.stringify(data));
    } else {
      localStorage.removeItem("authData");
    }

    setAxiosInterceptor(data);

    setAuthDataState(data);
  }

  async function checkAuth() {
    if (!authData.authenticated) return;
    try {
      await getInfoApi({
        endpoint: authData.endpoint,
        username: authData.user,
        password: authData.password,
        token: (authData?.token) ? (authData.token) : (undefined),
      });
    } catch (error) {
      setAuthData({
        user: "",
        password: "",
        endpoint: "",
        token:"",
        authenticated: false,
      });
    }
  }

  useEffect(() => {
    checkAuth();
  }, [initialData]);

  return (
    <AuthContext.Provider
      value={{
        authData,
        setAuthData,
        systemConfig,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
