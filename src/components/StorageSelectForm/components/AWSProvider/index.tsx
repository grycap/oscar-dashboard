import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useImperativeHandle, useState } from "react";
import { StorageProviderConfig, StorageProviderFormRef } from "../..";
import { AWSStorageProvider } from "@/pages/ui/services/models/service";

export interface AWSProviderConfig extends StorageProviderConfig {
  provider: "s3",
  connection: AWSStorageProvider
}

interface AWSProviderProps extends AWSStorageProvider {
  ref: React.Ref<AWSProviderFormRef>
}

export interface AWSProviderFormRef extends StorageProviderFormRef {
  validate: () => boolean;
  getProviderConfig: () => AWSProviderConfig;
}

function AWSProvider({ region = "", access_key = "", secret_key = "", ref }: AWSProviderProps) {
  const [config, setConfig] = useState<AWSProviderConfig>({
    provider: "s3",
    connection: {
      region,
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
        provider: "s3",
        connection: {
          region: config.connection.region.trim(),
          access_key: config.connection.access_key,
          secret_key: config.connection.secret_key,
        },
      }),
    };
  }, [config]);

  const updateConfig = (field: keyof AWSStorageProvider, nextValue: string) => {
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

export default AWSProvider;
