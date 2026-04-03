import { ManagedVolume } from "@/pages/ui/services/models/service";
import axios from "axios";

async function getVolumesApi() {
  const response = await axios.get("/system/volumes");
  return response.data as ManagedVolume[];
}

export default getVolumesApi;
