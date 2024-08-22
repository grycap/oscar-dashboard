import useServicesContext from "@/pages/ui/services/context/ServicesContext";

function EnviromentVariables() {
  const { formService, setFormService } = useServicesContext();

  if (!formService.environment) return null;

  return null;
}

export default EnviromentVariables;
