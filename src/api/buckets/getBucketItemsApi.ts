import BucketDetails from "@/models/bucketDetails";
import axios from "axios";

async function getBucketItemsApi(bucketName: string) {
  const response = await axios.get(`/system/buckets/${bucketName}`);
  return response.data as BucketDetails;
}

export default getBucketItemsApi;
