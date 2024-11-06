import { alert } from "@/lib/alert";
import axios, { AxiosInstance } from "axios";

interface InvokeServiceSyncProps {
  serviceName: string;
  file: File;
  token: string;
  endpoint: string;
}

export async function invokeServiceSync({
  serviceName,
  file,
  token,
  endpoint,
}: InvokeServiceSyncProps) {
  const axiosInstance: AxiosInstance = axios.create({
    baseURL: endpoint,
    headers: {
      "Content-Type": "application/octet-stream",
    },
  });

  try {
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        if (!reader.result || typeof reader.result !== "string") {
          alert.error("Error reading file");
          reject(new Error("Error reading file"));
        } else {
          resolve(reader.result.split(",")[1]);
        }
      };
      reader.onerror = () => {
        alert.error("Error reading file");
        reject(new Error("Error reading file"));
      };
    });

    const url = `/run/${serviceName}`;

    const response = await axiosInstance.post(url, base64Data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    alert.error("Error invoking service");
  }
}
