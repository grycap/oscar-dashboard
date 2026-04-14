import axios from "axios";

async function deleteVolumesApi(volumeName: string) {
  const response = await axios.delete(`/system/volumes/${volumeName}`);
  return response.data;
}

export default deleteVolumesApi;
