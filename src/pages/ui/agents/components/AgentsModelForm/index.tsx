import { useEffect, useImperativeHandle, useState } from "react";
import Editor from "@monaco-editor/react";
import { alert } from "@/lib/alert";
import { textToLF } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface AgentSkill {
  name: string;
  content: string;
}

export interface AgentsModelFormConfig {
  providerName: string;
  baseUrl: string;
  model: string;
  apiKey: string;
  agentSoul: string;
  agentSkills: AgentSkill[];
}

export type agentType = "exposed" | "on-demand" 

export interface AgentsModelFormRef {
  validate: () => boolean;
  getAgentsModelConfig: () => AgentsModelFormConfig;
}

interface AgentsModelFormProps {
  agentServiceType: agentType;
  noCustomSkillFiles?: boolean;
  noCustomSoulFile?: boolean;
  ref: React.Ref<AgentsModelFormRef>;
  preloadAgentSoul?: string;
  preloadAgentSkills?: AgentSkill[];
}

function AgentsModelForm({ agentServiceType, noCustomSkillFiles = false, noCustomSoulFile = false, ref, preloadAgentSoul, preloadAgentSkills }: AgentsModelFormProps) {
  const [formData, setFormData] = useState({
    providerName: "",
    baseUrl: "",
    model: "",
    apiKey: "",
  });
  const [agentSoul, setAgentSoul] = useState("");
  const [agentSkills, setAgentSkills] = useState<AgentSkill[]>([]);
  const [selectedSkillTab, setSelectedSkillTab] = useState("0");
  const [errors, setErrors] = useState({
    providerName: false,
    baseUrl: false,
    model: false,
    agentSoul: false,
  });

  useEffect(() => {
    if (preloadAgentSoul) {
      setAgentSoul(preloadAgentSoul);
    }
  }, [preloadAgentSoul]);
  
  useEffect(() => {
    if (preloadAgentSkills) {
      setAgentSkills(preloadAgentSkills);
    }
  }, [preloadAgentSkills]);

  useImperativeHandle(ref, () => ({
    validate: () => {
      const nextErrors = {
        providerName: !formData.providerName.trim(),
        baseUrl: !formData.baseUrl.trim(),
        model: !formData.model.trim(),
        agentSoul: !agentSoul.trim() && !noCustomSoulFile && agentServiceType === "on-demand",
      };
      console.log("Validation errors:", nextErrors);
      setErrors(nextErrors);
      return !Object.values(nextErrors).some(Boolean);
    },
    getAgentsModelConfig: () => ({
      providerName: formData.providerName.trim(),
      baseUrl: formData.baseUrl.trim(),
      model: formData.model.trim(),
      apiKey: formData.apiKey,
      agentSoul,
      agentSkills,
    }),
  }), [formData, agentSoul, agentSkills, agentServiceType, noCustomSoulFile]);

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-end">
        <div>
          <Label htmlFor="provider-name">Provider name</Label>
          <Input
            id="provider-name"
            placeholder="YOUR_LLM_PROVIDER_NAME"
            value={formData.providerName}
            onChange={(e) => {
              setFormData({ ...formData, providerName: e.target.value });
              if (errors.providerName) setErrors({ ...errors, providerName: false });
            }}
            error={errors.providerName ? "Provider name is required" : undefined}
          />
        </div>
        <div>
          <Label htmlFor="model">Model</Label>
          <Input
            id="model"
            placeholder="YOUR_OPENAI_MODEL"
            value={formData.model}
            onChange={(e) => {
              setFormData({ ...formData, model: e.target.value });
              if (errors.model) setErrors({ ...errors, model: false });
            }}
            error={errors.model ? "Model is required" : undefined}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="base-url">OpenAI-compatible base URL</Label>
        <Input
          id="base-url"
          placeholder="YOUR_OPENAI_BASE_URL"
          value={formData.baseUrl}
          error={errors.baseUrl ? "OpenAI base URL is required" : undefined}
          onChange={(e) => {
            setFormData({ ...formData, baseUrl: e.target.value });
            if (errors.baseUrl) setErrors({ ...errors, baseUrl: false });
          }}
        />
      </div>
      <div>
        <Label htmlFor="api-key">API key</Label>
        <Input
          id="api-key"
          type="password"
          placeholder="Leave empty to configure Hermes later"
          value={formData.apiKey}
          onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
        />
      </div>
      {agentServiceType === "on-demand" && (
      <>
        <div>
          <Label htmlFor="agent-soul">Agent Soul</Label>
          {!noCustomSoulFile && (
            <Input
              id="agent-soul"
              type="file"
              accept=".md"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) {
                  setAgentSoul("");
                  return;
                }
                if (!file.name.toLowerCase().endsWith(".md")) {
                  alert.error("Only .md files are supported for Agent Soul");
                  setAgentSoul("");
                  return;
                }
                const text = await file.text();
                setAgentSoul(textToLF(text));
                if (errors.agentSoul) setErrors({ ...errors, agentSoul: false });
              }}
              error={errors.agentSoul ? "Agent Soul is required" : undefined}
            />
          )}
          <details className="border border-slate-200 rounded-xl bg-slate-50 mt-3">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-slate-700">
              Agent Soul editor
            </summary>
            <div className="p-0">
              <div className="min-h-[180px] border border-input rounded-md overflow-hidden">
                <Editor
                  language="markdown"
                  value={agentSoul}
                  onChange={(value) => setAgentSoul(textToLF(value || ""))}
                  height="220px"
                  options={{ minimap: { enabled: false }, wordWrap: "on", scrollBeyondLastLine: false }}
                />
              </div>
            </div>
          </details>
        </div>

        <div>
          <Label htmlFor="agent-skills">Agent Skills</Label>
          {!noCustomSkillFiles && (
          <>
          <Input
            id="agent-skills"
            type="file"
            accept=".md"
            multiple
            onChange={async (e) => {
              const files = Array.from(e.target.files || []);
              if (files.length === 0) {
                setAgentSkills([]);
                return;
              }
              const invalidFile = files.find((file) => !file.name.toLowerCase().endsWith(".md"));
              if (invalidFile) {
                alert.error("Only .md files are supported for Agent Skills");
                setAgentSkills([]);
                return;
              }
              const fileTexts = await Promise.all(files.map((file) => file.text()));
              const nextSkills = files.map((file, index) => ({
                name: file.name,
                content: textToLF(fileTexts[index]),
              }));
              setAgentSkills(nextSkills);
              setSelectedSkillTab(nextSkills.length > 0 ? "0" : "0");
            }}
          />
          {agentSkills.length === 0 && (
          <div className="text-sm text-muted-foreground mt-2">
            Upload one or more markdown skill files to edit them individually.
          </div>
          )}
          </>
          )}

          {agentSkills.length > 0 && (
            <details className="border border-slate-200 rounded-xl bg-slate-50 mt-3">
              <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-slate-700">
                Agent Skills editor
              </summary>
              <div className="p-0">
                <Tabs className="mt-0 mb-0" value={selectedSkillTab} onValueChange={(value) => setSelectedSkillTab(value)}>
                  <TabsList className="gap-2 flex flex-wrap border border-input rounded-md rounded-b-none overflow-x-auto">
                    {agentSkills.map((skill, index) => (
                      <TabsTrigger key={`${skill.name}-${index}`} value={String(index)}>
                        {`Skill ${index + 1}`}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {agentSkills.map((skill, index) => (
                    <TabsContent className="mt-0 border border-input rounded-md rounded-t-none" key={`${skill.name}-${index}`} value={String(index)}>
                      <div className="mt-0 min-h-[180px] overflow-hidden">
                        <Editor
                          className="mt-0"
                          language="markdown"
                          value={skill.content}
                          onChange={(value) => {
                            setAgentSkills((prev) =>
                              prev.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, content: textToLF(value || "") }
                                  : item
                              )
                            );
                          }}
                          height="220px"
                          options={{ minimap: { enabled: false }, wordWrap: "on", scrollBeyondLastLine: false }}
                        />
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            </details>
          )}
        </div>
      </>
      )}
    </div>
  );
};

export default AgentsModelForm;
