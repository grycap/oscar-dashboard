import { MinioStorageProvider } from "@/pages/ui/services/models/service";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  S3Client,
  PutObjectCommand,
  ListBucketsCommand,
  Bucket,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";
import getSystemConfigApi from "@/api/config/getSystemConfig";
import { alert } from "@/lib/alert";

export type MinioProviderData = {
  providerInfo: MinioStorageProvider;
  setProviderInfo: (providerInfo: MinioStorageProvider) => void;
  buckets: Bucket[];
  setBuckets: (buckets: Bucket[]) => void;
  createBucket: (bucketName: string) => Promise<void>;
  updateBuckets: () => Promise<void>;
};

export const MinioContext = createContext({} as MinioProviderData);

export const MinioProvider = ({ children }: { children: React.ReactNode }) => {
  const [providerInfo, setProviderInfo] = useState({} as MinioStorageProvider);
  const [buckets, setBuckets] = useState<Bucket[]>([]);

  const client = useMemo(() => {
    if (
      !providerInfo.endpoint ||
      !providerInfo.access_key ||
      !providerInfo.secret_key ||
      !providerInfo.region
    )
      return null;

    return new S3Client({
      region: providerInfo.region,
      endpoint: providerInfo.endpoint,
      credentials: {
        accessKeyId: providerInfo.access_key,
        secretAccessKey: providerInfo.secret_key,
      },
      forcePathStyle: true,
    });
  }, [providerInfo]);

  useEffect(() => {
    async function getProviderInfo() {
      const config = await getSystemConfigApi();
      if (!config) return;

      setProviderInfo(config.minio_provider);
    }

    getProviderInfo();
  }, []);

  async function updateBuckets() {
    if (!client) return;

    const res = await client.send(new ListBucketsCommand({}));
    const buckets = res.Buckets;
    if (!buckets) return;

    setBuckets(buckets);
  }

  useEffect(() => {
    updateBuckets();
  }, [client]);

  async function createBucket(bucketName: string) {
    if (!client) return;

    try {
      const command = new CreateBucketCommand({
        Bucket: bucketName,
      });
      const response = await client.send(command);
      console.log(response);
      alert.success("Bucket created successfully");
    } catch (error) {
      console.error(error);
      alert.error("Error creating bucket");
    }

    updateBuckets();
  }

  return (
    <MinioContext.Provider
      value={{
        providerInfo,
        setProviderInfo,
        buckets,
        setBuckets,
        createBucket,
        updateBuckets,
      }}
    >
      {children}
    </MinioContext.Provider>
  );
};

export const useMinio = () => useContext(MinioContext);
