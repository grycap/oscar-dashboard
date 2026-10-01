import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useImperativeHandle, useState } from "react";
import { StorageProviderConfig, StorageProviderFormRef } from "../..";
import { MinioStorageProvider } from "@/pages/ui/services/models/service";
import CustomSwitch from "@/components/CustomSwitch";

export interface MinIOProviderConfig extends StorageProviderConfig {
  provider: "minio",
  connection: MinioStorageProvider
}

interface MinIOProviderProps extends MinioStorageProvider {
  ref: React.Ref<MinIOProviderFormRef>
}

export interface MinIOProviderFormRef extends StorageProviderFormRef {
  validate: () => boolean;
  getProviderConfig: () => MinIOProviderConfig;
}

function MinIOProvider({ endpoint = "", access_key = "", secret_key = "", region = "", verify = true, ref }: MinIOProviderProps) {
  const [config, setConfig] = useState<MinIOProviderConfig>({
    provider: "minio",
    connection: {
      endpoint,
      region,
      verify,
      access_key,
      secret_key,
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
          hostname: !config.connection.region.trim(),
          login: !config.connection.access_key.trim(),
          password: !config.connection.secret_key.trim(),
        };
        setErrors(nextErrors);
        return !Object.values(nextErrors).some(Boolean);
      },
      getProviderConfig: () => ({
        provider: "minio",
        connection: {
          endpoint: config.connection.endpoint,
          verify: config.connection.verify,
          region: config.connection.region.trim(),
          access_key: config.connection.access_key,
          secret_key: config.connection.secret_key,
        },
      }),
    };
  }, [config]);

  const updateConfig = (field: keyof MinioStorageProvider, nextValue: string | boolean) => {
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
          <Label>Endpoint</Label>
          <Input
            type="text"
            value={config.connection.endpoint}
            placeholder="Enter endpoint"
            className={errors.hostname ? "border-red-500 focus:border-red-500" : ""}
            onChange={(event) => updateConfig("endpoint", event.target.value)}
            error={errors.hostname ? "Endpoint is required" : undefined}
          />
        </div>
        <div className="mt-2">
          <CustomSwitch
            checked={config.connection.verify}
            title="Verify TLS"
            onChange={() => updateConfig("verify", !config.connection.verify)}
          />
        </div>
        <div>
          <Label>Region</Label>
          <Input
            type="text"
            value={config.connection.region}
            placeholder="Enter region"
            className={errors.hostname ? "border-red-500 focus:border-red-500" : ""}
            onChange={(event) => updateConfig("region", event.target.value)}
            error={errors.hostname ? "Region is required" : undefined}
          />
        </div>

        <div>
          <Label>Access Key</Label>
          <Input
            type="password"
            value={config.connection.access_key}
            placeholder="Enter access key"
            className={errors.login ? "border-red-500 focus:border-red-500" : ""}
            onChange={(event) => updateConfig("access_key", event.target.value)}
            error={errors.login ? "Access Key is required" : undefined}
          />
        </div>

        <div>
          <Label>Secret Key</Label>
          <Input
            type="password"
            value={config.connection.secret_key}
            placeholder="Enter secret key"
            className={errors.password ? "border-red-500 focus:border-red-500" : ""}
            onChange={(event) => updateConfig("secret_key", event.target.value)}
            error={errors.password ? "Secret Key is required" : undefined}
          />
        </div>
      </div>
    </details>

  );
}

export default MinIOProvider;
