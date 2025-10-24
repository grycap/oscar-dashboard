import { isSafariBrowser } from "@/lib/utils";
import { Service } from "@/pages/ui/services/models/service";
import axios from "axios";

async function deleteServiceApi(service: Service) {
  const response = await axios.delete("/system/services/" + service.name)
  .catch((error) => {
    if (isSafariBrowser() && error.status === 405 && error.response.data) {
      return error.response.data;
    }
    throw error;
  });

  return response.data;
}

export default deleteServiceApi;
