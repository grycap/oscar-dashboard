import { Service } from "@/pages/ui/services/models/service";
import axios from "axios";

async function createServiceApi(service: Service) {
  const response = await axios.post("/system/services", service)
  .catch((error) => {
    console.log("Debug Caught error in createServiceApi:", error);
    console.log("Debug Error status:", error.status);
    if (isSafariBrowser()) {
      console.log("Debug Handling Safari 405 error in createServiceApi");
      return error.response.data;
    }
    throw error;
  });

  return response.data;
}

export default createServiceApi;
