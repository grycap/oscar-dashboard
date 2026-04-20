import { ManagedVolumeCreateRequest } from "@/pages/ui/services/models/service";
import axios from "axios";

async function createVolumesApi(volume: ManagedVolumeCreateRequest) {
  const response = await axios.post("/system/volumes", volume);
  return response.data;
}

export default createVolumesApi;
