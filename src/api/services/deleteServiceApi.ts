import { isSafariBrowser } from "@/lib/utils";
import { Service } from "@/pages/ui/services/models/service";
import axios from "axios";

async function deleteServiceApi(service: Service) {
  const response = await axios.delete("/system/services/" + service.name).catch((error) => {
    if (!(axios.isAxiosError(error) && isSafariBrowser() && error.code === 'ERR_NETWORK')) {
      throw error;
    }
    console.log("Network error ignored on Safari browser");
    return { data: null };
  });

  return response.data;
}

export default deleteServiceApi;
