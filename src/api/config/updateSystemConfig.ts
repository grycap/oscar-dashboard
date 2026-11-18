import { ClusterConfigUpdate } from "@/models/systemConfig";
import axios from "axios";

async function updateSystemConfigApi(config: ClusterConfigUpdate) {
  const response = await axios.put("/system/config", config);

  return response.data;
}

export default updateSystemConfigApi;
