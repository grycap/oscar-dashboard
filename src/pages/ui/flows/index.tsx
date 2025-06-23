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
import { Info, Plus } from "lucide-react";

import { Check, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import yamlToServices from "../services/components/FDL/utils/yamlToService";
import { useAuth } from "@/contexts/AuthContext";
import { Service } from "../services/models/service";
import createServiceApi from "@/api/services/createServiceApi";
import useServicesContext from "../services/context/ServicesContext";
import { Link } from "react-router-dom";
import deleteServiceApi from "@/api/services/deleteServiceApi";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function FlowsView() {
  
  const { buckets } = useMinio();
  const { systemConfig, clusterInfo } = useAuth();
  const { authData } = useAuth();
  const [ kindInputBucket, setkindInputBucket ] = useState(false);
  const [showPasswordInfo, setShowPasswordInfo] = useState(false);

  
  const namePrefix =
    authData?.egiSession?.sub ?? authData?.token ?? authData?.user;
  const namePrefixSlice = namePrefix?.slice(0, 6);

  useEffect(() => {
      document.title ="OSCAR - Flows"
    });

  const oidcGroups = systemConfig?.config.oidc_groups ?? [];

  const { services, refreshServices } = useServicesContext();
  const initialVo = oidcGroups[0];

  const flowsService = services.find(
    (service) => service.name === `flows${namePrefixSlice}`
  );

  const isDeployed = !!flowsService;

  const [formData, setFormData] = useState({
    cpuCores: "1.0",
    memoryRam: "2",
    memoryUnit: "Gi",
    bucket: "",
    vo: initialVo ?? "",
    password: "",
  });

  function isVersionLower(version: string, target: string) {
    if (target === "devel") return true;
    if (version === "devel") return false;
    const v = version.split('.').map(x => parseInt(x.replace(/\D/g, '')) || 0);
    const t = target.split('.').map(x => parseInt(x.replace(/\D/g, '')) || 0);
    for (let i = 0; i < 3; i++) {
      if ((v[i] ?? 0) < (t[i] ?? 0)) return true;
      if ((v[i] ?? 0) > (t[i] ?? 0)) return false;
    }
    return false;
  }

  const handleDeploy = async () => {
    if (
      !formData.cpuCores ||
      !formData.memoryRam ||
      !formData.bucket ||
      !formData.vo ||
      !formData.password
    ) {
      alert.error("Please fill in all fields");
      return;
    }

    try {
      if (!namePrefix) throw Error("No name prefix found");

      const fdlUrl =
        "https://raw.githubusercontent.com/grycap/oscar-flows/refs/heads/main/flows.yaml";
      const fdlResponse = await fetch(fdlUrl);
      const fdlText = await fdlResponse.text();

      const scriptUrl =
        "https://raw.githubusercontent.com/grycap/oscar-flows/refs/heads/main/script.sh";
      const scriptResponse = await fetch(scriptUrl);
      const scriptText = await scriptResponse.text();

      const services = yamlToServices(fdlText, scriptText);
      if (!services?.length) throw Error("No services found");

      const service = services[0];
      let modifiedService: Service = {
        ...service,
        name: `flows${namePrefixSlice}`,
        vo: formData.vo,
        memory: `${formData.memoryRam}${formData.memoryUnit}`,
        cpu: formData.cpuCores,
        mount: {
          ...service.mount,
          path: formData.bucket ?? "/flows",
          storage_provider: service.mount?.storage_provider ?? "minio.default",
        },
        environment: {
          variables: {
            ...service.environment.variables,
            NODE_RED_BASE_URL: `/system/services/flows${namePrefixSlice}/exposed`,
            NODE_RED_DIRECTORY: "/mnt/"+ formData.bucket,
          },
          secrets:{
            ...service.environment.secrets,
            PASSWORD:	 formData.password != "" ? formData.password : "admin",
          }
        },
      };
      if (
        clusterInfo?.version && 
        (clusterInfo.version !== "devel" || isVersionLower(clusterInfo.version, "3.6.0"))
      ) {
        modifiedService.environment.variables.PASSWORD = modifiedService.environment.secrets.PASSWORD;
        delete modifiedService.environment.secrets.PASSWORD;
      }
      
      console.log(modifiedService)

      await createServiceApi(modifiedService);
      refreshServices();

      alert.success("Node-RED instance deployed");
    } catch (error) {
      console.log(error)
      alert.error("Error deploying Node-RED instance");
    }
  };

  useEffect(() => {
    if (oidcGroups.length) {
      setFormData({ ...formData, vo: oidcGroups[0] });
    }
  }, [oidcGroups.length]);

  async function handleDelete() {
    if (!flowsService) return;
    try {
      await deleteServiceApi(flowsService);
      refreshServices();
      alert.success("Node-RED instance deleted");
    } catch (error) {
      console.error(error);
      alert.error("Error deleting Node-RED instance");
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 w-[95%] sm:w-[90%] lg:w-[80%] mx-auto mt-[40px] min-w-[300px] max-w-[700px] content-start">
      <h1 className="text-center sm:text-left" style={{ fontSize: "24px", fontWeight: "500" }}>
        Node-RED
      </h1>
      <Card>
        <CardHeader>
          <CardTitle key={isDeployed.toString()}>
            {isDeployed ? "Deployment" : "Configuration"}
          </CardTitle>
        </CardHeader>

        <CardContent>
          {!isDeployed ? (
            <form className="grid grid-cols-1 gap-4">
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
                      <SelectValue id="memory-unit" placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Gi">Gi</SelectItem>
                      <SelectItem value="Mi">Mi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password" className="pr-2">Admin password</Label>
                {clusterInfo?.version && (clusterInfo?.version !== "devel" && isVersionLower(clusterInfo?.version!, "3.6.0")) &&
                <Popover open={showPasswordInfo} onOpenChange={() => setShowPasswordInfo((v) => !v)}>
                  <PopoverTrigger asChild>
                    <span className="bg-yellow-200 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded cursor-pointer">
                      <Info className="inline w-3 h-3 mr-1" />
                        Warning
                    </span>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <small>
                      For OSCAR versions queal or lower than <b>3.5.3</b>, the admin password will be set as an
                      environment variable instead of a secret. All users that have access to the service
                      will be able to see the password.
                    </small>
                  </PopoverContent>
                </Popover>
                }
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="Enter admin password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bucket">Bucket</Label>
                {kindInputBucket? 
                <Input
                  id="bucket-value"
                  type="input"
                  onFocus={(e) => (e.target.type = "text")}
                  style={{ width: "100%",
                    fontWeight: "normal",
                   }}
                  onChange={(e) => {
                     setFormData({ ...formData, bucket: e.target?.value })
                  }}
                 
                  placeholder="Select a bucket"
                />
                :
                  <Select
                    value={formData.bucket}
                    onValueChange={(value) =>
                      setFormData({ ...formData, bucket: value })
                    }
                  >
                    <SelectTrigger id="bucket">
                      <SelectValue
                        id="bucket-value"
                        placeholder="Select a bucket"
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {buckets.map((bucket) => (
                        <SelectItem key={bucket.Name} value={bucket.Name!}>
                          {bucket.Name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                }
                <div className="flex justify-end space-x-2">
                <Button 
                        id="add-annotations-button"
                        size={"sm"}
                        style={{
                          width: "max-content",
                        }}
                        onClick={() => {
                            setkindInputBucket(!kindInputBucket);
                        }}
                      >
                  <Plus className="h-4 w-4 mr-2" /> {kindInputBucket?"Buckets created":"New Bucket"}
                </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vo">VO</Label>
                <Select
                  value={formData.vo}
                  onValueChange={(value) =>
                    setFormData({ ...formData, vo: value })
                  }
                >
                  <SelectTrigger id="vo">
                    <SelectValue placeholder="Select a VO" />
                  </SelectTrigger>
                  <SelectContent>
                    {oidcGroups.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </form>
          ) : (
            <Alert>
              <Check className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>
                Your Node-RED instance has been deployed.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="grid grid-cols-1">
          {!isDeployed ? (
            <RequestButton id="flows-deploy-button " request={handleDeploy} className="sm:justify-self-end">
              Deploy
            </RequestButton>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-[auto_auto] gap-2 justify-end">
              <Link
                key={`flows-${namePrefixSlice}`}
                to={`${
                  authData.endpoint
                }/system/services/flows${namePrefixSlice}/exposed/`}
                target="_blank"
              >
                <Button id="flows-visit-button" className="w-full">
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Visit
                </Button>
              </Link>
              <RequestButton
                id="flows-delete-button"
                variant={"destructive"}
                request={handleDelete}
              >
                Delete
              </RequestButton>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default FlowsView;
