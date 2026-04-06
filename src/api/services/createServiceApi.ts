import { isSafariBrowser } from "@/lib/utils";
import { Service } from "@/pages/ui/services/models/service";
import axios from "axios";

async function createServiceApi(service: Service) {
  const response = await axios.post("/system/services", service).catch((error) => {
    if (!(axios.isAxiosError(error) && isSafariBrowser() && error.code === 'ERR_NETWORK')) {
      throw error;
    }
    console.log("Network error ignored on Safari browser");
    return { data: null };
  });

  return response.data;
}

export default createServiceApi;
