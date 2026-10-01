import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useImperativeHandle, useState } from "react";
import { StorageProviderConfig, StorageProviderFormRef } from "../..";
import { WebdavStorageProvider } from "@/pages/ui/services/models/service";

export interface WebdavProviderConfig extends StorageProviderConfig {
  provider: "webdav",
  connection: WebdavStorageProvider
}

interface WebdavProviderProps extends WebdavStorageProvider {
  ref: React.Ref<WebdavProviderFormRef>
}

export interface WebdavProviderFormRef extends StorageProviderFormRef {
  validate: () => boolean;
  getProviderConfig: () => WebdavProviderConfig;
}

const normalizeHostname = (value: string) => value.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");

function WebdavProvider({ hostname = "", login = "", password = "", ref }: WebdavProviderProps) {
  const [config, setConfig] = useState<WebdavProviderConfig>({
    provider: "webdav",
    connection: {
      hostname,
      login,
      password,
    },
  });
  
  const [errors, setErrors] = useState({
    hostname: false,
    login: false,
    password: false,
  });

  useImperativeHandle(ref, () => {
    return {
      validate() {
        const nextErrors = {
          hostname: !config.connection.hostname.trim(),
          login: !config.connection.login.trim(),
          password: !config.connection.password.trim(),
        };
        setErrors(nextErrors);
        return !Object.values(nextErrors).some(Boolean);
      },
      getProviderConfig: () => ({
        provider: "webdav",
        connection: {
          hostname: config.connection.hostname.trim(),
          login: config.connection.login.trim(),
          password: config.connection.password,
        },
      }),
    };
  }, [config]);

  const updateConfig = (field: keyof WebdavStorageProvider, nextValue: string) => {
    setConfig((prev) => ({ ...prev, connection: { ...prev.connection, [field]: nextValue } }));
    setErrors((prev) => ({ ...prev, [field]: false }));
  };

  return (
    <details className={`border  rounded-xl bg-slate-50 mt-3 ${errors.hostname || errors.login || errors.password ? "border-red-500" : "border-slate-200"}`}>
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-slate-700">
        Connection Credentials
      </summary>
      <div className="px-4 pb-4">
        <div>
          <Label>Hostname</Label>
          <Input
            type="text"
            value={normalizeHostname(config.connection.hostname)}
            placeholder="Enter hostname"
            className={errors.hostname ? "border-red-500 focus:border-red-500" : ""}
            onChange={(event) => updateConfig("hostname", normalizeHostname(event.target.value))}
            error={errors.hostname ? "Hostname is required" : undefined}
          />
        </div>

        <div>
          <Label>Login</Label>
          <Input
            type="text"
            value={config.connection.login}
            placeholder="Enter login"
            className={errors.login ? "border-red-500 focus:border-red-500" : ""}
            onChange={(event) => updateConfig("login", event.target.value)}
            error={errors.login ? "Login is required" : undefined}
          />
        </div>

        <div>
          <Label>Password</Label>
          <Input
            type="password"
            value={config.connection.password}
            placeholder="Enter password"
            className={errors.password ? "border-red-500 focus:border-red-500" : ""}
            onChange={(event) => updateConfig("password", event.target.value)}
            error={errors.password ? "Password is required" : undefined}
          />
        </div>
      </div>
    </details>

  );
}

export default WebdavProvider;
