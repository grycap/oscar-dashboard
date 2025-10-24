import { isSafariBrowser } from "@/lib/utils";
import { Service } from "@/pages/ui/services/models/service";
import axios from "axios";

async function createServiceApi(service: Service) {
  const response = await axios.post("/system/services", service)
  .catch((error) => {
    if (isSafariBrowser() && error.status === 405 && error.response.data) {
      return error.response.data;
    }
    throw error;
  });

  return response.data;
}

export default createServiceApi;
