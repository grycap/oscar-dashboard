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
  ListBucketsCommand,
  Bucket,
  ListObjectsV2Command,
  ListObjectsV2CommandInput,
  CommonPrefix,
  _Object,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import getSystemConfigApi from "@/api/config/getSystemConfig";
import { alert } from "@/lib/alert";
import JSZip from "jszip";
import env from "@/env";
import createBucketsApi from "@/api/buckets/createBucketsApi";
import deleteBucketsApi from "@/api/buckets/deleteBucketsApi";
import updateBucketsApi from "@/api/buckets/updateBucketsApi";
import { Bucket as Bucket_oscar } from "@/pages/ui/services/models/service"
import getBucketsApi from "@/api/buckets/getBucketsApi";
import { getMimeTypeFromPath } from "@/lib/mimeType";
import { errorMessage } from "@/lib/error";

interface BucketsFilterProps {
  myBuckets: boolean;
  query: string;
  by: BucketFilterBy;
}

export interface UploadFileResult {
  fileName: string;
  key: string;
  success: boolean;
  error?: string;
}

export interface UploadBatchProgress {
  total: number;
  completed: number;
  failed: number;
  currentFileName?: string;
  results: UploadFileResult[];
}

export enum BucketFilterBy {
  NAME = "name",
  OWNER = "owner",
  SERVICE = "service",
}

export type MinioProviderData = {
  bucketsFilter: BucketsFilterProps;
  setBucketsFilter: (filter: BucketsFilterProps) => void;
  providerInfo: MinioStorageProvider;
  setProviderInfo: (providerInfo: MinioStorageProvider) => void;
  bucketsOSCAR: Bucket_oscar[];
  buckets: Bucket[];
  bucketsAreLoading: boolean;
  uploadProgress: UploadBatchProgress | null;
  clearUploadProgress: () => void;
  bucketsLoadingError: boolean;
  setBuckets: (buckets: Bucket[]) => void;
  createBucket: (bucketName: Bucket_oscar) => Promise<void>;
  updateBucketsVisibilityControl: (bucketName: Bucket_oscar) => Promise<void>; 
  updateBuckets: () => Promise<void>;
  getBucketItems: (
    bucketName: string,
    path: string
  ) => Promise<{
    folders: CommonPrefix[];
    items: _Object[];
  }>;
  deleteBucket: (bucketName: string) => Promise<void>;
  createFolder: (bucketName: string, folderName: string) => Promise<void>;
  uploadFiles: (
    bucketName: string,
    path: string,
    files: File[]
  ) => Promise<UploadFileResult[]>;
  deleteFile: (bucketName: string, path: string) => Promise<void>;
  getFileBlob: (bucketName: string, path: string) => Promise<Blob | undefined>;
  listObjects: (bucketName: string, path: string) => Promise<_Object[]>;
  downloadAndZipFolders: (
    bucketName: string,
    folders: CommonPrefix[],
    singleFiles: _Object[]
  ) => Promise<Blob | undefined>;
};

function isLocalhostDeployed(endpoint:string){
  if (env.response_default_minio === endpoint){
    return true
  }else return false
}
export const MinioContext = createContext({} as MinioProviderData);

export const MinioProvider = ({ children }: { children: React.ReactNode }) => {
  const [providerInfo, setProviderInfo] = useState({} as MinioStorageProvider);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [bucketsOSCAR, setBucketsOSCAR] = useState<Bucket_oscar[]>([]);
  const [bucketsAreLoading, setBucketsAreLoading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<UploadBatchProgress | null>(null);
  const [bucketsLoadingError, setBucketsLoadingError] = useState<boolean>(false);

  const [bucketsFilter, setBucketsFilter] = useState<BucketsFilterProps>({
    myBuckets: false,
    query: "",
    by: BucketFilterBy.NAME,
  });

  const client = useMemo(() => {
    if (
      !providerInfo.endpoint ||
      !providerInfo.access_key ||
      !providerInfo.secret_key ||
      !providerInfo.region
    )
      return null;
    providerInfo.endpoint =  isLocalhostDeployed(providerInfo.endpoint) ? "http://"+env.minio_local_endpoint+":"+env.minio_local_port : providerInfo.endpoint;
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

  /**
   * Lists folders and items within a specific path inside an S3 bucket.
   * @param bucketName Name of the S3 bucket.
   * @param path Path within the bucket. Use an empty string for the root.
   * @returns An object containing arrays of folders and items.
   */
  async function getBucketItems(
    bucketName: string,
    path: string = ""
  ): Promise<{
    folders: CommonPrefix[];
    items: _Object[];
  }> {
    if (!client) return { folders: [], items: [] };

    // Ensure the prefix ends with '/' when the path is not empty
    const prefix = path ? (path.endsWith("/") ? path : `${path}/`) : "";

    const params: ListObjectsV2CommandInput = {
      Bucket: bucketName,
      Prefix: prefix,
      Delimiter: "/", // Use '/' as delimiter to group folders
    };

    try {
      const command = new ListObjectsV2Command(params);
      const response = await client.send(command);

      // Extract folders (CommonPrefixes)
      const folders = response.CommonPrefixes ?? [];

      // Extract items (Contents)
      const items =
        response.Contents?.filter((item) => item.Key !== prefix) ?? [];

      return { folders, items };
    } catch (error) {
      console.error("Error listing S3 objects:", error);
      throw error;
    }
  }

 async function updateBucketsVisibilityControl(bucket:Bucket_oscar) {
    if (!client) return;
    try {
      await updateBucketsApi(bucket)
      alert.success("Bucket updated successfully");
    } catch (error) {
      console.error(error);
      alert.error(`Error updating bucket: ${errorMessage(error)}`);
    }
    updateBuckets();
  
  }


  async function updateBuckets() {
    if (!client) return;
    let bucketsOSCAR: Bucket_oscar[] = [];
    try {
      setBucketsAreLoading(true);
      setBucketsLoadingError(false);

      bucketsOSCAR = (await getBucketsApi()) ?? [];

      const res = await client.send(new ListBucketsCommand({}));
      const buckets = res?.Buckets;
      if (!buckets) return;

      setBucketsOSCAR(bucketsOSCAR);
      setBuckets(buckets);
    } catch (error) {
      const statusCode = (error as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode;
      if (statusCode === 403 && bucketsOSCAR.length === 0) {
        setBuckets([]);
        setBucketsOSCAR([]);
      } else {
        console.error("Error fetching buckets:", error);
        alert.error(`Error fetching buckets: ${errorMessage(error)}`);
        setBucketsLoadingError(true);
      }
    } finally {
      setBucketsAreLoading(false);
    }
  }

  async function createBucket(bucketName: Bucket_oscar) {
    if (!client) return;

    try {
      await createBucketsApi(bucketName)
      /*const command = new CreateBucketCommand({
        Bucket: bucketName,
      });
      await client.send(command);*/
      alert.success("Bucket created successfully");
    } catch (error) {
      console.error(error);
      alert.error(`Error creating bucket: ${errorMessage(error)}`);
    }

    updateBuckets();
  }

  async function deleteBucket(bucketName: string) {
    if (!client) return;

    try {
      await deleteBucketsApi(bucketName)
      /*const command = new DeleteBucketCommand({ Bucket: bucketName });
      await client.send(command);*/

      alert.success("Bucket deleted successfully");
    } catch (error) {
      console.error(error);
      alert.error(`Error deleting bucket: ${errorMessage(error)}`);
    }

    updateBuckets();
  }

  async function createFolder(bucketName: string, folderName: string) {
    if (!client) return;

    const folderKey = folderName.endsWith("/") ? folderName : `${folderName}/`;

    try {
      await client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: folderKey,
        })
      );
      alert.success("Folder created successfully");
    } catch (error) {
      console.error(error);
      alert.error(`Error creating folder: ${errorMessage(error)}`);
    }

    updateBuckets();
  }

  function clearUploadProgress() {
    setUploadProgress(null);
  }

  async function uploadFiles(
    bucketName: string,
    path: string,
    files: File[]
  ): Promise<UploadFileResult[]> {
    if (!client || files.length === 0) return [];

    const results: UploadFileResult[] = [];

    setUploadProgress({
      total: files.length,
      completed: 0,
      failed: 0,
      currentFileName: files[0]?.name,
      results: [],
    });

    for (const file of files) {
      const key = path ? `${path}${file.name}` : file.name;

      setUploadProgress((current) =>
        current
          ? {
              ...current,
              currentFileName: file.name,
            }
          : current
      );

      try {
        const fileContent = new Uint8Array(await file.arrayBuffer());
        const command = new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          ContentType: file.type || undefined,
          Body: fileContent,
        });
        await client.send(command);

        const result: UploadFileResult = {
          fileName: file.name,
          key,
          success: true,
        };
        results.push(result);
        setUploadProgress((current) =>
          current
            ? {
                ...current,
                completed: current.completed + 1,
                results: [...current.results, result],
              }
            : current
        );
      } catch (error) {
        console.error(error);
        const message =
          error instanceof Error ? error.message : "Error uploading file";
        const result: UploadFileResult = {
          fileName: file.name,
          key,
          success: false,
          error: message,
        };
        results.push(result);
        setUploadProgress((current) =>
          current
            ? {
                ...current,
                completed: current.completed + 1,
                failed: current.failed + 1,
                results: [...current.results, result],
              }
            : current
        );
      }
    }

    await updateBuckets();

    setUploadProgress((current) =>
      current
        ? {
            ...current,
            currentFileName: undefined,
          }
        : current
    );

    const successfulUploads = results.filter((result) => result.success).length;
    const failedUploads = results.length - successfulUploads;
    const fileLabel = files.length === 1 ? "file" : "files";

    if (failedUploads === 0) {
      alert.success(`Uploaded ${successfulUploads} ${fileLabel} successfully`);
    } else if (successfulUploads === 0) {
      alert.error(`Failed to upload ${failedUploads} ${fileLabel}`);
    } else {
      alert.warning(
        `Uploaded ${successfulUploads} ${fileLabel}. ${failedUploads} failed.`
      );
    }

    return results;
  }

  async function deleteFile(bucketName: string, path: string) {
    if (!client) return;

    try {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: path,
      });
      await client.send(command);
      alert.success("File deleted successfully");
    } catch (error) {
      console.error(error);
      alert.error(`Error deleting file: ${errorMessage(error)}`);
    }

    updateBuckets();
  }

  async function getFileBlob(bucketName: string, path: string) {
    if (!client) return;

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: path,
    });
    const response = await client.send(command);
    const byteArray = await response.Body?.transformToByteArray();
    if (!byteArray) {
      throw new Error("Failed to transform response body to byte array");
    }
    const safeArray = new Uint8Array(byteArray);
    return new Blob([safeArray], { type: getMimeTypeFromPath(path) });
  }

  async function listObjects(bucketName: string, path: string = "") {
    if (!client) return [];

    let objects: _Object[] = [];
    let continuationToken: string | undefined = undefined;

    do {
      const params: ListObjectsV2CommandInput = {
        Bucket: bucketName,
        Prefix: path,
        ContinuationToken: continuationToken,
      };

      const response = await client.send(new ListObjectsV2Command(params));
      if (response.Contents) {
        objects = objects.concat(response.Contents);
      }
      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return objects;
  }

  // Helper to download a file as an ArrayBuffer
  async function downloadFile(bucketName: string, key: string) {
    const params = { Bucket: bucketName, Key: key };
    const data = await client?.send(new GetObjectCommand(params));
    if (!data?.Body) return undefined;
    return await data.Body.transformToByteArray();
  }

  async function downloadAndZipFolders(
    bucketName: string,
    folders: CommonPrefix[],
    singleFiles: _Object[]
  ) {
    const zip = new JSZip();

    try {
      for (const folder of folders) {
        const objects = await listObjects(bucketName, folder.Prefix!);

        for (const object of objects) {
          const relativePath = object.Key!.replace(folder.Prefix!, "");
          if (!relativePath) continue; // Skip empty folders

          const fileData = await downloadFile(bucketName, object.Key!);

          // Add file to the ZIP archive
          if (fileData) {
            const safeData = new Uint8Array(fileData); 
            zip.file(`${folder.Prefix}${relativePath}`, new Blob([safeData]));
          } else {
            throw new Error(`Error downloading file: ${object.Key}`);
          }
        }
      }

      for (const file of singleFiles) {
        const fileData = await downloadFile(bucketName, file.Key!);
        if (fileData) {
          const safeData = new Uint8Array(fileData);
          zip.file(file.Key!, new Blob([safeData]));
        } else {
          throw new Error(`Error downloading file: ${file.Key}`);
        }
      }

      // Generate the ZIP and return it
      const zipBlob = await zip.generateAsync({ type: "blob" });
      return zipBlob;
    } catch (err) {
      alert.error(
        err instanceof Error ? err.message : "Error during download"
      );
    }
  }

  useEffect(() => {
    async function getProviderInfo() {
      const config = await getSystemConfigApi();
      if (!config) return;

      setProviderInfo(config.minio_provider);
    }

    getProviderInfo();
  }, []);

  useEffect(() => {
    updateBuckets();
  }, [client]);

  return (
    <MinioContext.Provider
      value={{
        bucketsFilter,
        setBucketsFilter,
        providerInfo,
        setProviderInfo,
        bucketsOSCAR,
        buckets,
        bucketsAreLoading,
        uploadProgress,
        clearUploadProgress,
        bucketsLoadingError,
        setBuckets,
        createBucket,
        createFolder,
        updateBuckets,
        updateBucketsVisibilityControl,
        getBucketItems,
        deleteBucket,
        uploadFiles,
        deleteFile,
        getFileBlob,
        listObjects,
        downloadAndZipFolders,
      }}
    >
      {children}
    </MinioContext.Provider>
  );
};

export const useMinio = () => useContext(MinioContext);
