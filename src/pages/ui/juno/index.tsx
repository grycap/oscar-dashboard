import RequestButton from "@/components/RequestButton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMinio } from "@/contexts/Minio/MinioContext";
import { alert } from "@/lib/alert";

import { Check, ExternalLink } from "lucide-react";
import { useState } from "react";
import yamlToServices from "../services/components/FDL/utils/yamlToService";
import { useAuth } from "@/contexts/AuthContext";
import { Service } from "../services/models/service";
import createServiceApi from "@/api/services/createServiceApi";
import useServicesContext from "../services/context/ServicesContext";
import { Link } from "react-router-dom";
import deleteServiceApi from "@/api/services/deleteServiceApi";

function JunoView() {
  const { buckets } = useMinio();

  const { authData } = useAuth();
  const namePrefix = authData?.token ?? authData?.user;
  const namePrefixSlice = namePrefix?.slice(0, 6);

  const { services, refreshServices } = useServicesContext();
  const initialVo = localStorage.getItem("oidc_groups") as string;

  const junoService = services.find(
    (service) => service.name === `juno${namePrefixSlice}`
  );

  const isDeployed = !!junoService;

  const [formData, setFormData] = useState({
    cpuCores: "1.0",
    memoryRam: "2",
    memoryUnit: "Gi",
    bucket: "",
    vo: initialVo ?? "",
  });

  const handleDeploy = async () => {
    if (
      !formData.cpuCores ||
      !formData.memoryRam ||
      !formData.bucket ||
      !formData.vo
    ) {
      alert.error("Please fill in all fields");
      return;
    }

    try {
      if (!namePrefix) throw Error("No name prefix found");

      const fdlUrl =
        "https://raw.githubusercontent.com/grycap/oscar/master/examples/expose_services/jupyter/jupyter_expose_mount.yaml";
      const fdlResponse = await fetch(fdlUrl);
      const fdlText = await fdlResponse.text();

      const scriptUrl =
        "https://raw.githubusercontent.com/grycap/oscar/refs/heads/master/examples/expose_services/jupyter/jupyterscript2.sh";
      const scriptResponse = await fetch(scriptUrl);
      const scriptText = await scriptResponse.text();

      const services = yamlToServices(fdlText, scriptText);
      if (!services.length) throw Error("No services found");

      const service = services[0];
      const modifiedService: Service = {
        ...service,
        name: `juno${namePrefixSlice}`,
        vo: formData.vo,
        memory: `${formData.memoryRam}${formData.memoryUnit}`,
        cpu: formData.cpuCores,
        mount: {
          ...service.mount,
          path: formData.bucket ?? "/notebook",
          storage_provider: service.mount?.storage_provider ?? "minio.default",
        },
        environment: {
          ...service.environment,
          Variables: {
            ...service.environment.Variables,
            JUPYTER_TOKEN: authData?.token ?? "",
            JHUB_BASE_URL: `/system/services/juno${namePrefixSlice}/exposed`,
          },
        },
      };

      await createServiceApi(modifiedService);
      refreshServices();

      alert.success("Jupyter Notebook instance deployed");
    } catch (error) {
      alert.error("Error deploying Jupyter Notebook instance");
    }
  };

  async function handleDelete() {
    if (!junoService) return;
    try {
      await deleteServiceApi(junoService);
      refreshServices();
      alert.success("Jupyter Notebook instance deleted");
    } catch (error) {
      console.error(error);
      alert.error("Error deleting Jupyter Notebook instance");
    }
  }

  return (
    <div
      style={{
        width: "60vw",
        paddingTop: "40px",
        paddingLeft: "20%",
        paddingRight: "20%",
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        flexBasis: 0,
        overflowY: "auto",
        rowGap: "24px",
      }}
    >
      <h1 style={{ fontSize: "24px", fontWeight: "500" }}>Jupyter Notebook</h1>
      <Card>
        <CardHeader>
          <CardTitle key={isDeployed.toString()}>
            {isDeployed ? "Deployment" : "Service parameters"}
          </CardTitle>
        </CardHeader>

        <CardContent>
          {!isDeployed ? (
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cpu-cores">CPU Cores</Label>
                <Input
                  id="cpu-cores"
                  type="number"
                  step="0.1"
                  placeholder="Enter CPU cores"
                  value={formData.cpuCores}
                  onChange={(e) =>
                    setFormData({ ...formData, cpuCores: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="memory-ram">Memory RAM</Label>
                <div className="flex space-x-2">
                  <Input
                    id="memory-ram"
                    type="number"
                    step={formData.memoryUnit === "Gi" ? 1 : 256}
                    placeholder="Enter memory RAM"
                    value={formData.memoryRam}
                    onChange={(e) =>
                      setFormData({ ...formData, memoryRam: e.target.value })
                    }
                    className="flex-grow"
                  />
                  <Select
                    value={formData.memoryUnit}
                    onValueChange={(value) =>
                      setFormData({ ...formData, memoryUnit: value })
                    }
                  >
                    <SelectTrigger className="w-[80px]">
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Gi">Gi</SelectItem>
                      <SelectItem value="Mi">Mi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bucket">Bucket</Label>
                <Select
                  value={formData.bucket}
                  onValueChange={(value) =>
                    setFormData({ ...formData, bucket: value })
                  }
                >
                  <SelectTrigger id="bucket">
                    <SelectValue placeholder="Select a bucket" />
                  </SelectTrigger>
                  <SelectContent>
                    {buckets.map((bucket) => (
                      <SelectItem key={bucket.Name} value={bucket.Name!}>
                        {bucket.Name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vo">VO</Label>
                <Input
                  id="vo"
                  type="text"
                  placeholder="Enter VO"
                  value={formData.vo}
                  onChange={(e) =>
                    setFormData({ ...formData, vo: e.target.value })
                  }
                />
              </div>
            </form>
          ) : (
            <Alert>
              <Check className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>
                Your Jupyter Notebook instance has been deployed.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          {!isDeployed ? (
            <RequestButton request={handleDeploy}>Deploy</RequestButton>
          ) : (
            <>
              <Link
                key={`juno-${namePrefixSlice}`}
                to={`${
                  authData.endpoint
                }/system/services/juno${namePrefixSlice}/exposed/lab?token=${
                  authData.token ?? ""
                }`}
                target="_blank"
              >
                <Button>
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Visit
                </Button>
              </Link>
              <RequestButton variant={"destructive"} request={handleDelete}>
                Delete
              </RequestButton>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default JunoView;
