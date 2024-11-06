import { Button } from "@/components/ui/button";
import { ServiceViewMode } from "..";
import { useLastUriParam } from "@/hooks/useLastUriParam";
import { Link, useParams } from "react-router-dom";
import { CreateUpdateServiceButton } from "./CreateUpdateButton";
import { InvokePopover } from "../../InvokePopover";

interface Props {
  mode: ServiceViewMode;
}

function CreateUpdateServiceTabs({ mode }: Props) {
  const tab = useLastUriParam();
  const { serviceId } = useParams();
  const isInCreateMode = mode === ServiceViewMode.Create;
  const isInUpdateMode = mode === ServiceViewMode.Update;

  function getVariant(label: string) {
    return tab === label ? "lightGreen" : "ghost";
  }

  const isSettingsTab = tab === "settings";

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
      {isInUpdateMode && (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "9px",
            marginLeft: "auto",
          }}
        >
          <Link to={`/ui/services/${serviceId}/settings`}>
            <Button variant={getVariant("settings")}>Settings</Button>
          </Link>

          <Link to={`/ui/services/${serviceId}/logs`}>
            <Button variant={getVariant("logs")}>Logs</Button>
          </Link>
        </div>
      )}

      <div
        style={{
          minWidth: "80px",
          marginLeft: "auto",
          display: "flex",
          flexDirection: "row",
          gap: "10px",
        }}
      >
        {isInUpdateMode && <InvokePopover />}
        {(isSettingsTab || isInCreateMode) && (
          <CreateUpdateServiceButton isInCreateMode={isInCreateMode} />
        )}
      </div>
    </div>
  );
}

export default CreateUpdateServiceTabs;
