import { Volumes } from "@/pages/ui/services/models/service";
import axios from "axios";

async function getVolumesApi() {
  const response = await axios.get("/system/volumes");
  console.log("getVolumesApi response:", response.data);
  return response.data as Volumes;
}

export default getVolumesApi;
