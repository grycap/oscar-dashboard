import { Button } from "@/components/ui/button";
import { ServiceTopbarMode } from "..";

interface Props {
  mode: ServiceTopbarMode;
}

function CreateUpdateServiceTabs({ mode }: Props) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        flexGrow: 1,
        justifyContent: "center",
        gap: "9px",
      }}
    >
      <Button>Settings</Button>
      {mode !== ServiceTopbarMode.Create && <Button>Logs</Button>}
    </div>
  );
}

export default CreateUpdateServiceTabs;
