import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useServicesContext from "../../context/ServicesContext";
import {
  Dialog,
  DialogDescription,
  DialogTitle,
  DialogContent,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { Input } from "@/components/ui/input";
import createServiceApi from "@/api/services/createServiceApi";
import getServiceApi from "@/api/services/getServiceApi";
import updateServiceApi from "@/api/services/updateServiceApi";
import { alert } from "@/lib/alert";
import RequestButton from "@/components/RequestButton";
import { safeScriptExtractor, yamlToServicesOnly } from "./utils/yamlToService";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { errorMessage } from "@/lib/error";

function FDLForm() {
  const { showFDLModal, setShowFDLModal, refreshServices, formService } =
    useServicesContext();
  const [selectedTab, setSelectedTab] = useState<string>("fdl");
  const [editorKey, setEditorKey] = useState(0);

  const existingService = formService && formService.name && formService.name !== "" && formService.script && formService.script !== "script.sh";

  const [fdl, setFdl] = useState("");
  const [script, setScript] = useState<string[]>([""]);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (selectedTab === "fdl") {
        setFdl(result);
      } else {
        const index = Number(selectedTab.replace("script", ""));
        setScript((prev) => prev.map((s, i) => (i === index ? result : s)));
      }
    };
    reader.readAsText(file);
  }

  function handleDeleteScript(index: number) {
    if (script.length <= 1) return;

    if (selectedTab === `script${index}`) {
      const newLength = script.length - 1;
      const newIndex = Math.min(index, newLength - 1);
      setSelectedTab(newIndex >= 0 ? `script${newIndex}` : "fdl");
    } else if (selectedTab !== "fdl") {
      const currentIndex = Number(selectedTab.replace("script", ""));
      if (currentIndex > index) {
        setSelectedTab(`script${currentIndex - 1}`);
      }
    }

    setScript((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!fdl) {
      alert.error("Please fill the FDL file");
      return;
    }

    if (!script) {
      alert.error("Please fill the script");
      return;
    }

    const services = yamlToServicesOnly(fdl);
    if (!services) {
      return;
    }
    if (script.length != services.length) {
      alert.error("The number of scripts does not match the number of services defined in the FDL file.");
      return;
    }
    try {
      for (const service of services) {
        service.script = safeScriptExtractor(service.script.toString(), script);
      }
    } catch (error) {
      alert.error(`Error: ${errorMessage(error)}`);
      return;
    }
    if (existingService && services.length === 1) {
      services[0].name = formService.name;
    }
    var createMode = true;
    const promises = services.map(async (service) => {
      try{
        await getServiceApi(service.name);
        createMode = false;
      }catch (error) {
        const response = await createServiceApi(service);
        return response;
      }
        const response = await updateServiceApi(service);
        return response;
    });

    const results = await Promise.allSettled(promises);

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        alert.error(
          `Error ${createMode ? "creating" : "updating"} service ${services[index].name}: ${result.reason.response.data}`
        );
      } else {
        alert.success(`Service ${services[index].name} ${createMode ? "created" : "updated"} successfully`);
      }
    });

    if (results.every((result) => result.status === "fulfilled")) {
      setShowFDLModal(false);
      setFdl("");
      setScript([""]);
      setSelectedTab("fdl");
      refreshServices();
    }
  }

  useEffect(() => {
    const handleResize = () => {
      setEditorKey((prevKey) => prevKey + 1);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (!showFDLModal) {
      setFdl("");
      setScript([""]);
      setSelectedTab("fdl");
    } /*else {
      if (existingService){
        //const { fdlText, scriptText } = getFDLAndScriptText(formService);
        setFdl(fdlText);
        setScript({});
      }
    }*/
  }, [showFDLModal]);

  return (
    <Dialog open={showFDLModal} onOpenChange={setShowFDLModal}>
      {/* <DialogTrigger>Open</DialogTrigger> */}
      <DialogContent className="grid grid-cols-1 grid-rows-[auto_1fr_auto] w-screen sm:w-[70%] 2xl:w-[60%] h-[90%] sm:h-[80%] 2xl:h-[60%] overflow-y-auto gap-4">
        <DialogHeader>
          <DialogTitle>Create the service using FDL</DialogTitle>
          <DialogDescription>
            Use the code editor to edit the FDL file and the script.
          </DialogDescription>
        </DialogHeader>
        <Tabs className="grid grid-cols-1 grid-rows-[auto_1fr]"
          defaultValue="account"
          value={selectedTab}
          onValueChange={(value) => {
            setSelectedTab(value);
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-2 justify-items-start">
            <TabsList className="flex h-auto flex-wrap justify-start">
              <TabsTrigger className="px-8 py-2" value="fdl">
                FDL
              </TabsTrigger>
              {script.map((_, i) => (
                <div key={`script-tab-${i}`} className="relative inline-flex items-center">
                  <TabsTrigger className={script.length > 1 ? "pl-4 pr-8 py-2" : "px-4 py-2"} value={`script${i}`}>
                    {`Script ${i + 1}`}
                  </TabsTrigger>
                  {script.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteScript(i);
                      }}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-sm p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700"
                      title="Delete script"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setScript((prev) => [...prev, ""]);
                  setSelectedTab(`script${script.length}`);
                }}
                title="Add Script"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TabsList>

            <Input className="min-w-[200px]" key={selectedTab} type="file" onChange={handleFileUpload} />
          </div>
          <TabsContent value="fdl" style={{ outline: "none", width: "100%" }}>
            <Editor
              key={`fdl-${editorKey}`}
              language="yaml"
              value={fdl}
              onChange={(e) => {
                setFdl(e || "");
              }}
              width="100%"
              height="100%"
              options={{
                minimap: {
                  enabled: false,
                },
              }}
            />
          </TabsContent>
          {script.map((s, i) => (
            <TabsContent
              key={`script-${i}`}
              value={`script${i}`}
              style={{ outline: "none", width: "100%" }}
            >
              <Editor 
              key={`script-${i}-${editorKey}`}
              language="javascript"
              value={s}
              onChange={(e) => {
                setScript((prev) => prev.map((script, idx) => (idx === i ? (e || "") : script)));
              }}
              width="100%"
              height="100%"
              options={{
                minimap: {
                  enabled: false,
                },
              }}
            />
          </TabsContent>
          ))}
        </Tabs>
        <DialogFooter>
          <RequestButton request={handleSave}>{existingService ? "Update Service" : "Create Service"}</RequestButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default FDLForm;
