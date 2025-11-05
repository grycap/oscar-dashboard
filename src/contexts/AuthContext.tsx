import getSystemConfigApi from "@/api/config/getSystemConfig";
import { getInfoApi } from "@/api/info/getInfoApi";
import { setAxiosInterceptor } from "@/lib/axiosClient";
import { ClusterInfo } from "@/models/clusterInfo";
import { SystemConfig } from "@/models/systemConfig";
import { MinioStorageProvider } from "@/pages/ui/services/models/service";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type EGISessionInfo = {
  eduperson_assurance: string[]; // List of URLs for assurance levels
  eduperson_entitlement: string[]; // List of entitlement values
  email: string; // User email address
  email_verified: boolean; // Indicates whether the email is verified
  family_name: string; // User last name
  given_name: string; // User first name
  name: string; // User full name
  preferred_username: string; // Preferred username
  sub: string; // Unique user identifier
  voperson_verified_email: string[]; // List of verified email addresses

  group_membership: string[]; 
};

export type AuthData = {
  user: string;
  password: string;
  endpoint: string;
  token?: string;
  authenticated?: boolean;
  egiSession?: EGISessionInfo;
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
  systemConfig: null as {
    config: SystemConfig;
    minio_provider: MinioStorageProvider;
  } | null,
  clusterInfo: null as ClusterInfo | null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const initialData = useMemo(() => {
    const storedData = localStorage.getItem("authData");
    if (!storedData) {
      return {
        user: "",
        password: "",
        endpoint: "",
        token: undefined,
        authenticated: false,
      } as AuthData;
    }

    const parsedData = JSON.parse(storedData) as AuthData;

    setAxiosInterceptor(parsedData);

    return parsedData;
  }, []);

  const [authData, setAuthDataState] = useState(initialData);
  const [systemConfig, setSystemConfig] = useState<{
    config: SystemConfig;
    minio_provider: MinioStorageProvider;
  } | null>(null);
  const [clusterInfo, setClusterInfo] = useState<ClusterInfo | null>(null);

  async function handleGetSystemConfig() {
    if (!authData.authenticated) return;

    let response = await getSystemConfigApi() as {
      config: SystemConfig;
      minio_provider: MinioStorageProvider;
    } | null;
    if (response && authData.token === undefined && response.config.oidc_groups.length === 1 && response.config.oidc_groups[0] === "") {
      response.config.oidc_groups[0] = " ";
    } else if (response && response.config.oidc_groups.length > 1) {
      response.config.oidc_groups = response.config.oidc_groups.map((group) => group === "" ? " " : group);
    }

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
      setClusterInfo(await getInfoApi({
        endpoint: authData.endpoint,
        username: authData.user,
        password: authData.password,
        token: authData?.token,
      }));
    } catch (error) {
      setAuthData({
        user: "",
        password: "",
        endpoint: "",
        authenticated: false,
        egiSession: undefined,
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
        clusterInfo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
