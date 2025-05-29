import { Bucket } from "@/pages/ui/services/models/service"
import axios from "axios";

async function updateBucketApi(bucket: Bucket) {
  const response = await axios.put("/system/buckets", bucket);

  return response.data;
}

export default updateBucketApi;
