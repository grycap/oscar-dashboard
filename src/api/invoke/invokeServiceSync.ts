import axios, { AxiosInstance } from "axios";

interface InvokeServiceSyncProps {
  serviceName: string;
  file: File;
  token: string;
  endpoint: string;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        const base64String = reader.result.startsWith("data:")
          ? reader.result.split(",")[1]
          : reader.result;
        resolve(base64String);
      } else {
        reject(new Error("Failed to read file as a Base64 string."));
      }
    };

    reader.onerror = () => {
      reject(new Error("Error reading file."));
    };

    reader.readAsBinaryString(file);
  });
}

export default async function invokeServiceSync({
  serviceName,
  file,
  token,
  endpoint,
}: InvokeServiceSyncProps) {
  // Create an Axios instance with the specified base URL
  const axiosInstance: AxiosInstance = axios.create({
    baseURL: endpoint,
  });

  try {
    const base64Data: string = await readFileAsBase64(file);

    const url: string = `/run/${serviceName}`;

    const response = await axiosInstance.post(url, btoa(base64Data), {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error invoking service:", error);

    throw new Error("Error invoking service");
  }
}
