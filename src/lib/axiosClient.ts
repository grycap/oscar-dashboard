import { AuthData } from "@/contexts/AuthContext";
import axios from "axios";

export function setAxiosInterceptor(authData: AuthData) {
  const { endpoint, user: username, password } = authData;

  axios.interceptors.request.use((config) => {
    config.baseURL = endpoint;
    config.auth = {
      username,
      password,
    };
    return config;
  });
}
