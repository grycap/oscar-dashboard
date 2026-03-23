import { PresignedURIRequest, PresignedURIResponse } from "@/models/presignedURI";
import axios from "axios";

async function createPresignedObjectUrlApi(bucketName: string, request: PresignedURIRequest): Promise<PresignedURIResponse> {
  const response  = await axios.post(`/system/buckets/${bucketName}/presign`, request)
  return response.data as PresignedURIResponse;
}

export default createPresignedObjectUrlApi;