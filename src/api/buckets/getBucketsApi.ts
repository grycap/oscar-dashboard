import { Bucket } from "@/pages/ui/services/models/service"
import axios from "axios";

async function getBucketsApi() {
  const response = await axios.get("/system/buckets");
  return response.data as Bucket[];
}

export default getBucketsApi;
