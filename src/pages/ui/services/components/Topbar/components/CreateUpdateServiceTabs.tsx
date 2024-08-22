import { Button } from "@/components/ui/button";
import { ServiceViewMode } from "..";

interface Props {
  mode: ServiceViewMode;
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
      {mode === ServiceViewMode.Update && (
        <>
          <Button>Settings</Button>
          <Button>Logs</Button>
        </>
      )}
    </div>
  );
}

export default CreateUpdateServiceTabs;
