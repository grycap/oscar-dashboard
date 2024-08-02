import axios from "axios";

async function getServicesApi() {
  const response = await axios.get("/system/services");

  return response.data;
}

export default getServicesApi;
