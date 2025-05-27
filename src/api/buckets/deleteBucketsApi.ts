//import { Bucket } from "@/pages/ui/services/models/service"
import axios from "axios";

async function deleteBucketsApi(bucket: string) {
  const response  = await axios.delete("/system/buckets/"+bucket)
  console.log(bucket)
  return response;
}

export default deleteBucketsApi;
