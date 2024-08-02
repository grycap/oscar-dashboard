import getServicesApi from "@/api/services/getServicesApi";
import { useEffect, useState } from "react";

function Services() {
  const [services, setServices] = useState([]);

  useEffect(() => {
    getServicesApi().then((data) => {
      setServices(data);
    });
  }, []);

  console.log(services);

  return <></>;
}

export default Services;
