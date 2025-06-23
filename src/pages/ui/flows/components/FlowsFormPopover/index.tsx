import { Button } from "@/components/ui/button";
import OscarColors from "@/styles";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { alert } from "@/lib/alert";
import yamlToServices from "@/pages/ui/services/components/FDL/utils/yamlToService";
import { Service } from "@/pages/ui/services/models/service";
import createServiceApi from "@/api/services/createServiceApi";
import useServicesContext from "@/pages/ui/services/context/ServicesContext";
import { useMinio } from "@/contexts/Minio/MinioContext";
import { Info, RefreshCcwIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import RequestButton from "@/components/RequestButton";



function FlowsFormPopover() {
  const { buckets } = useMinio();
  const [isOpen, setIsOpen] = useState(false);
  const {systemConfig, clusterInfo } = useAuth();
  const { refreshServices } = useServicesContext();
  const [newBucket, setNewBucket] = useState(false);
  
  const oidcGroups = systemConfig?.config?.oidc_groups ?? [];

  const [formData, setFormData] = useState({
      cpuCores: "1.0",
      memoryRam: "2",
      memoryUnit: "Gi",
      bucket: "",
      vo: "",
      password: "",
      secret: "",
  });

  useEffect(() => {
    if (oidcGroups.length > 0 && !formData.vo) {
      setFormData((prev) => ({ ...prev, vo: oidcGroups[0] }));
    }
  }, [oidcGroups]);

  useEffect(() => {
    if (!isOpen) return;
    setFormData((prev) => ({
      ...prev, 
      secret: genRandomString(),
      cpuCores: "1.0",
      memoryRam: "2",
      memoryUnit: "Gi",
      bucket: "",
      password: "",
    }));
  }, [isOpen]);

  function genRandomString() {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(32));
    return Array.from(values, v => charset[v % charset.length]).join('');
  }

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
      const uuid = crypto.randomUUID().split("-");
      const serviceName = `flows-${uuid[0]+uuid[1]}`;

      let modifiedService: Service = {
        ...service,
        name: serviceName,
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
            NODE_RED_BASE_URL: `/system/services/${serviceName}/exposed`,
            NODE_RED_DIRECTORY: "/mnt/"+ formData.bucket,
          },
          secrets:{
            ...service.environment.secrets,
            PASSWORD:	 formData.password != "" ? formData.password : "admin",
            SECRET: formData.secret != "" ? formData.secret : genRandomString(),
          }
        },
        labels: {
          ...service.labels,
          node_red: "true",
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
      setIsOpen(false);
    } catch (error) {
      console.log(error)
      alert.error("Error deploying Node-RED instance");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          tooltipLabel="New Node-RED Instance"
          onClick={() => {setIsOpen(false)}}
        >
          New
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[600px] max-h-[90%] overflow-y-auto gap-4">
        <DialogHeader>
        <DialogTitle>
            <span style={{ color: OscarColors.DarkGrayText }}>
            {`Node-RED Instance Configuration`}
            </span>
        </DialogTitle>
        </DialogHeader>
          <hr></hr>
          <div className="grid grid-cols-1 gap-y-2 sm:gap-x-2 ">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-end">
              <div>
                <Label htmlFor="cpu-cores">CPU Cores</Label>
                <Input
                  id="cpu-cores"
                  type="number"
                  step={0.1}
                  placeholder="Enter CPU Cores"
                  value={formData.cpuCores}
                  onChange={(e) =>
                    setFormData({ ...formData, cpuCores: e.target.value })
                  }
                ></Input>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
                  <div>
                    <Label htmlFor="memory-ram">Memory RAM</Label>
                    <Input
                      id="memory-ram"
                      type="number"
                      step={formData.memoryUnit === "Gi" ? 1 : 256}
                      placeholder="Enter memory RAM"
                      value={formData.memoryRam}
                      onChange={(e) =>
                        setFormData({ ...formData, memoryRam: e.target.value })
                      }
                    />
                  </div>
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
            <div>
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
            <div>
              <Label htmlFor="password">Password 
                {clusterInfo?.version && (clusterInfo?.version !== "devel" && isVersionLower(clusterInfo?.version!, "3.6.0")) &&
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="bg-yellow-200 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded cursor-pointer ml-2">
                          <Info className="inline w-3 h-3 mr-1" />
                          Warning
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="w-80 sm:ml-[150px] ml-0">
                        <small>
                          For OSCAR versions equal or lower than <b>3.5.3</b>, the admin password will be set as an
                          environment variable instead of a secret. All users that have access to the service
                          will be able to see the password.
                        </small>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                }
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter admin password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              ></Input>
            </div>
            <div>
              <Label className="flex items-center">
                Credentials secret
                <Button variant={"link"} size={"icon"} 
                  onClick={() => setFormData({ ...formData, secret: genRandomString()})}
                >
                  <RefreshCcwIcon size={16} 
                    onMouseEnter={(e) => {e.currentTarget.style.transform = 'rotate(90deg)'}}
                    onMouseLeave={(e) => {e.currentTarget.style.transform = 'rotate(0deg)'}}
                  />
                </Button>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter credentials secret"
                value={formData.secret}
                onChange={(e) =>
                  setFormData({ ...formData, secret: e.target.value })
                }
              ></Input>
            </div>
            <div>
              <Label>Bucket</Label>
              <hr className="mb-2"/>
              <div>
                <Label className="inline-flex items-center cursor-pointer">
                  <input type="checkbox" value="" className="sr-only peer" onClick={() => { setNewBucket(!newBucket) }} />
                  <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600 dark:peer-checked:bg-teal-600"></div>
                  <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">New Bucket</span>
                </Label>
                {newBucket? 
                <Input
                  type="input"
                  onFocus={(e) => (e.target.type = "text")}
                  style={{ width: "100%",
                    fontWeight: "normal",
                    }}
                  onChange={(e) => {
                      setFormData({ ...formData, bucket: e.target?.value })
                  }}
                  placeholder="Enter new bucket name"
                />
                :
                  <Select
                    value={formData.bucket}
                    onValueChange={(value) =>
                      setFormData({ ...formData, bucket: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
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
              </div>
            </div>
          </div>
        <DialogFooter>
          <RequestButton className="grid grid-cols-[auto] sm:grid-cols-1 gap-2" variant={"mainGreen"} request={handleDeploy}>
            Deploy
          </RequestButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default FlowsFormPopover;