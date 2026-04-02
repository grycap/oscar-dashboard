import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, FolderGit2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export interface GitHubSource {
  repository: string;
  branch: string;
}

export function equalSources(source1: GitHubSource, source2: GitHubSource): boolean {
  return source1.repository === source2.repository && source1.branch === source2.branch;
}

const OSCAR_HUB_SOURCES_KEY = "oscar_hub_sources";
const OSCAR_HUB_SELECTED_SOURCE_KEY = "oscar_hub_selected_source";
export const DEFAULT_SOURCES = [
  { repository: "grycap/oscar-hub", branch: "main" }
];

function HubSrcPopoverButton( {
  responsiveButton = "sm",
  variant,
  className,
  selectedSource,
  setSelectedSource,
}: {
  responsiveButton?: "none" | "sm" | "md" | "lg";
  variant?: "link" | "default" | "destructive" | "outline" | "secondary" | "ghost" | "mainGreen" | "lightGreen" | null | undefined;
  className?: string;
  selectedSource: GitHubSource;
  setSelectedSource: (source: GitHubSource) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [sources, setSources] = useState<GitHubSource[]>(DEFAULT_SOURCES);
  const [newRepo, setNewRepo] = useState("");
  const [newBranch, setNewBranch] = useState("");

  const newRepoFormatError: boolean = !!newRepo && ( !newRepo.trim().startsWith("https://github.com/") || newRepo.trim().replace("https://github.com/", "").length <= 0 );

  useEffect(() => {
    try {
      const storedSource = localStorage.getItem(OSCAR_HUB_SELECTED_SOURCE_KEY);
      setSelectedSource(storedSource ? JSON.parse(storedSource) : DEFAULT_SOURCES[0]);
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error("Error parsing OSCAR HUB selected source from localStorage, processing to reset to default source:", error);
        localStorage.setItem(OSCAR_HUB_SELECTED_SOURCE_KEY, JSON.stringify(DEFAULT_SOURCES[0]));
        setSelectedSource(DEFAULT_SOURCES[0]);
      }
    }

    try {
      const storedSources = localStorage.getItem(OSCAR_HUB_SOURCES_KEY);
      const parsedSources: GitHubSource[] = storedSources ? JSON.parse(storedSources) : [];
      const uniqueSources = parsedSources.filter((source) => !DEFAULT_SOURCES.find((defaultSource) => equalSources(defaultSource, source)));
      setSources([...DEFAULT_SOURCES, ...uniqueSources]);
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error("Error parsing OSCAR HUB sources from localStorage, processing to reset to default sources:", error);
        localStorage.setItem(OSCAR_HUB_SOURCES_KEY, JSON.stringify(DEFAULT_SOURCES));
        setSources(DEFAULT_SOURCES);
      }
    }
  }, []);

  function removeSource(sourceToRemove: GitHubSource): void {
    const updatedSources = sources.filter((source) => !equalSources(source, sourceToRemove));
    setSources(updatedSources);
    localStorage.setItem(OSCAR_HUB_SOURCES_KEY, JSON.stringify(updatedSources));
    if (!updatedSources.find((source) => equalSources(source, selectedSource))) {
      setSelectedSource(DEFAULT_SOURCES[0]);
      localStorage.setItem(OSCAR_HUB_SELECTED_SOURCE_KEY, JSON.stringify(DEFAULT_SOURCES[0]));
    }
  }

  function selectSource(source: GitHubSource): void {
    setSelectedSource(source);
    localStorage.setItem(OSCAR_HUB_SELECTED_SOURCE_KEY, JSON.stringify(source));
  }

  function addSource(): void {
    const trimmedRepo = newRepo.trim().replace("https://github.com/", "");
    const trimmedBranch = newBranch.trim();
    if (!trimmedRepo || !trimmedBranch || newRepoFormatError) return;

    const newSource: GitHubSource = { repository: trimmedRepo, branch: trimmedBranch };
    if (sources.find((s) => equalSources(s, newSource))) return;
    const updatedSources = [...sources, newSource];
    setSources(updatedSources);
    localStorage.setItem(OSCAR_HUB_SOURCES_KEY, JSON.stringify(updatedSources));
    setNewRepo("");
    setNewBranch("");
  }

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setNewRepo("");
          setNewBranch("");
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button 
					className={className}
          variant={variant}
          tooltipLabel={"Manage sources"}
          onClick={() => {setIsOpen(!isOpen)}}
          style={{gap: 8}} 
        >
          <FolderGit2 size={20} className="h-5 w-5" />
          <span className={{ none: "", sm: "hidden sm:inline", md: "hidden md:inline", lg: "hidden lg:inline" }[responsiveButton]}>Manage Sources</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="center">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Manage Source</h4>
          </div>
          <p className="text-sm font-medium">Select source</p>
          <div className="flex flex-col gap-2 max-h-52 overflow-y-auto">
            {sources.map((source, index) => (
              <div
                key={index}
                className={`flex items-center justify-between gap-3 rounded border px-3 py-2 cursor-pointer ${
                  equalSources(selectedSource, source)
                    ? "border-[#009688] bg-[#009688]/10"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
                onClick={() => selectSource(source)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Check
                    className={`h-4 w-4 shrink-0 ${
                      equalSources(selectedSource, source)
                        ? "text-[#009688]"
                        : "text-transparent"
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="truncate font-medium text-sm">{source.repository}</div>
                    <div className="text-xs text-muted-foreground">{source.branch}</div>
                  </div>
                </div>
                {!DEFAULT_SOURCES.includes(source) && (
                  <Button
                    className="hover:bg-red-100 dark:hover:bg-red-950"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); removeSource(source); }}
                    aria-label={`Remove ${source.repository}`}
                  >
                    <Trash2 className="h-4 w-4" color="red" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <p className="border-t pt-3 text-sm font-medium">Add source</p>
          <div className="">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor="new-repo" className="text-xs">Repository</Label>
                <Input
                  id="new-repo"
                  placeholder="https://github.com/owner/repo"
                  value={newRepo}
                  onChange={(e) => setNewRepo(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addSource(); }}
                  className={`${
                    newRepoFormatError ? "border-red-500" : ""
                  }`}
                />
                {newRepoFormatError && (
                  <span className="text-xs text-red-500">Please enter a valid GitHub repository URL.</span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="new-branch" className="text-xs">Branch</Label>
                <Input
                  id="new-branch"
                  placeholder="main"
                  value={newBranch}
                  onChange={(e) => setNewBranch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addSource(); }}
                />
              </div>
              
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="lightGreen"
              className="w-full"
              onClick={addSource}
              disabled={!newRepo.trim() || !newBranch.trim() || newRepoFormatError}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default HubSrcPopoverButton;