import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Editor from "@monaco-editor/react";
import RequestButton from "@/components/RequestButton";
import useServicesContext from "@/pages/ui/services/context/ServicesContext";
import createServiceApi from "@/api/services/createServiceApi";
import getServiceApi from "@/api/services/getServiceApi";
import updateServiceApi from "@/api/services/updateServiceApi";
import yamlToServices from "@/pages/ui/services/components/FDL/utils/yamlToService";
import { alert } from "@/lib/alert";
import { getFDLAndScriptText, isVersionLower } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

function InlineFDLEditor() {
  const { formService, refreshServices } = useServicesContext();
  const { clusterInfo } = useAuth();
  const existingService = useMemo(
    () =>
      !!(
        formService?.name &&
        formService?.script &&
        formService.script !== "script.sh"
      ),
    [formService]
  );

  const [isOpen, setIsOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"fdl" | "script">("fdl");
  const [editorKey, setEditorKey] = useState(0);
  const [fdl, setFdl] = useState("");
  const [script, setScript] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !formService) return;

    const { fdlText, scriptText } = getFDLAndScriptText(formService);
    setFdl(fdlText);
    setScript(scriptText);
    setSelectedTab("fdl");
    setEditorKey((prev) => prev + 1);
  }, [isOpen, formService]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (selectedTab === "fdl") {
        setFdl(result);
      } else {
        setScript(result);
      }
    };
    reader.readAsText(file);
  };

  async function handleSave() {
    if (!fdl) {
      alert.error("Please fill the FDL file");
      return;
    }

    if (!script) {
      alert.error("Please fill the script");
      return;
    }

    const services = yamlToServices(
      fdl,
      script,
      !!clusterInfo && !isVersionLower(clusterInfo.version, "v4.1.0")
    );
    if (!services || services.length === 0) {
      return;
    }

    let createMode = true;
    setIsSaving(true);

    try {
      const promises = services.map(async (service) => {
        try {
          await getServiceApi(service.name);
          createMode = false;
        } catch (error) {
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
            `Error ${createMode ? "creating" : "updating"} service ${services[index].name}: ${result.reason.response?.data ?? result.reason}`
          );
        } else {
          alert.success(
            `Service ${services[index].name} ${createMode ? "created" : "updated"} successfully`
          );
        }
      });

      if (results.every((result) => result.status === "fulfilled")) {
        setIsOpen(false);
        refreshServices();
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-3 w-full">
      <Button
        variant="secondary"
        className="w-full justify-center"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {isOpen ? "Hide FDL editor" : "Edit FDL and script inline"}
      </Button>

      {isOpen && (
        <div className="border border-slate-200 rounded-xl bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-600 dark:text-slate-300">
                Edit the current service FDL and script directly in the panel.
              </div>
              <Input type="file" onChange={handleFileUpload} className="max-w-[260px]" />
            </div>
            <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as "fdl" | "script")} className="grid grid-cols-1 grid-rows-[auto_1fr]"> 
              <TabsList>
                <TabsTrigger value="fdl">FDL</TabsTrigger>
                <TabsTrigger value="script">Script</TabsTrigger>
              </TabsList>
              <TabsContent value="fdl" className="min-h-[360px]">
                <Editor
                  key={`fdl-${editorKey}`}
                  language="yaml"
                  value={fdl}
                  onChange={(value) => setFdl(value || "")}
                  width="100%"
                  height="100%"
                  options={{ minimap: { enabled: false } }}
                />
              </TabsContent>
              <TabsContent value="script" className="min-h-[360px]">
                <Editor
                  key={`script-${editorKey}`}
                  language="javascript"
                  value={script}
                  onChange={(value) => setScript(value || "")}
                  width="100%"
                  height="100%"
                  options={{ minimap: { enabled: false } }}
                />
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <RequestButton request={handleSave} disabled={isSaving}>
              {existingService ? "Update service" : "Create service"}
            </RequestButton>
          </div>
        </div>
      )}
    </div>
  );
}

export default InlineFDLEditor;
