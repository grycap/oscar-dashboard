import { useImperativeHandle, useState } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { StoragePath } from "@/pages/ui/services/models/service";

const INPUT_STORAGE_PROVIDERS = ["minio.default"];
const OUTPUT_STORAGE_PROVIDERS = ["minio.default"];

interface InputOutputStorageConfig {
  input: StoragePath[];
  output: StoragePath[];
}

export interface InputOutputStorageFormRef {
  validate: () => boolean;
  getInputOutputStorageConfig: () => InputOutputStorageConfig;
}

const isBucketPath = (value: string) => {
  const trimmed = value.trim();
  return /^[^/\s]+\/[^/\s].+$/.test(trimmed);
};

function InputOutputStorageForm({ ref }: { ref: React.Ref<InputOutputStorageFormRef> }) {
  const [inOutStorageConfig, setInOutStorageConfig] = useState<InputOutputStorageConfig>({
    input: [
      {
        storage_provider: INPUT_STORAGE_PROVIDERS[0],
        path: "",
        prefix: [],
        suffix: [],
      },
    ],
    output: [
      {
        storage_provider: OUTPUT_STORAGE_PROVIDERS[0],
        path: "",
        prefix: [],
        suffix: [],
      },
    ],
  });

  const [errors, setErrors] = useState<{
    input_path: boolean;
    output_path: boolean;
    input_storage_provider: boolean;
    output_storage_provider: boolean;
  }>({
    input_path: false,
    output_path: false,
    input_storage_provider: false,
    output_storage_provider: false,
  });

  useImperativeHandle(ref, () => ({
    validate: () => {
      const nextErrors = {
        input_storage_provider: !inOutStorageConfig.input[0].storage_provider.trim(),
        input_path: !isBucketPath(inOutStorageConfig.input[0].path),
        output_storage_provider: !inOutStorageConfig.output[0].storage_provider.trim(),
        output_path: !isBucketPath(inOutStorageConfig.output[0].path),
      };
      setErrors(nextErrors);
      return !Object.values(nextErrors).some(Boolean);
    },
    getInputOutputStorageConfig: () => inOutStorageConfig,
  }), [inOutStorageConfig]);

  return (
    <div className="flex flex-col gap-4 pt-2">
      <details className={`border rounded-xl bg-slate-50 ${errors.input_storage_provider || errors.input_path ? "border-red-500" : "border-slate-200"}`}>
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-slate-700">
          Input
        </summary>
        <div className="p-4 grid gap-2">
          <Label>Storage Provider</Label>
          <Select
            value={inOutStorageConfig.input[0].storage_provider}
            onValueChange={(value) => {
              setInOutStorageConfig({
                ...inOutStorageConfig,
                input: [{ ...inOutStorageConfig.input[0], storage_provider: value }],
              });
              setErrors((prev) => ({ ...prev, input_storage_provider: !value.trim() }));
            }}
          >
            <SelectTrigger className={errors.input_storage_provider ? "border-red-500 focus:border-red-500" : ""}>
              <SelectValue placeholder="Select input provider" />
            </SelectTrigger>
            <SelectContent>
              {INPUT_STORAGE_PROVIDERS.map((provider) => (
                <SelectItem key={provider} value={provider}>
                  {provider}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Label>Input Path</Label>
          <Input
            type="text"
            value={inOutStorageConfig.input[0].path}
            style={{ width: "100%", fontWeight: "normal" }}
            onChange={(e) => {
              const path = e.target.value;
              setInOutStorageConfig({
                ...inOutStorageConfig,
                input: [{ ...inOutStorageConfig.input[0], path }],
              });
              setErrors((prev) => ({ ...prev, input_path: !isBucketPath(path) }));
            }}
            placeholder="bucket_name/folder"
            error={errors.input_path ? "Input path must be bucket_name/folder" : undefined}
          />
        </div>
      </details>

      <details className={`border rounded-xl bg-slate-50 ${errors.output_storage_provider || errors.output_path ? "border-red-500" : "border-slate-200"}`}>
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-slate-700">
          Output
        </summary>
        <div className="p-4 grid gap-2">
          <Label>Storage Provider</Label>
          <Select
            value={inOutStorageConfig.output[0].storage_provider}
            onValueChange={(value) => {
              setInOutStorageConfig({
                ...inOutStorageConfig,
                output: [{ ...inOutStorageConfig.output[0], storage_provider: value }],
              });
              setErrors((prev) => ({ ...prev, output_storage_provider: !value.trim() }));
            }}
          >
            <SelectTrigger className={errors.output_storage_provider ? "border-red-500 focus:border-red-500" : ""}>
              <SelectValue placeholder="Select output provider" />
            </SelectTrigger>
            <SelectContent>
              {OUTPUT_STORAGE_PROVIDERS.map((provider) => (
                <SelectItem key={provider} value={provider}>
                  {provider}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Label>Output Path</Label>
          <Input
            type="text"
            value={inOutStorageConfig.output[0].path}
            style={{ width: "100%", fontWeight: "normal" }}
            onChange={(e) => {
              const path = e.target.value;
              setInOutStorageConfig({
                ...inOutStorageConfig,
                output: [{ ...inOutStorageConfig.output[0], path }],
              });
              setErrors((prev) => ({ ...prev, output_path: !isBucketPath(path) }));
            }}
            placeholder="bucket_name/folder"
            error={errors.output_path ? "Output path must be bucket_name/folder" : undefined}
          />
        </div>
      </details>
    </div>
  );
};

export default InputOutputStorageForm;