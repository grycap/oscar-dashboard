import { Bucket } from "@/pages/ui/services/models/service"
import axios from "axios";

async function createBucketsApi(bucket: Bucket) {
  const response  = await axios.post("/system/buckets", bucket)
  console.log(response)
  return response;
}

export default createBucketsApi;
