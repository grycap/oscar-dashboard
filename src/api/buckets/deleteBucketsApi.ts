import { Bucket } from "@aws-sdk/client-s3";
import axios from "axios";

async function deleteBucketsApi(bucket: Bucket) {
  const response  = await axios.delete("/system/bucket")
  console.log(bucket)
  return response;
}

export default deleteBucketsApi;
