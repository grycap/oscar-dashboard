import { ClusterConfig } from "@/models/systemConfig";
import axios from "axios";

async function updateSystemConfigApi(config: ClusterConfig) {
  const response = await axios.put("/system/config", config);

  return response.data;
}

export default updateSystemConfigApi;
