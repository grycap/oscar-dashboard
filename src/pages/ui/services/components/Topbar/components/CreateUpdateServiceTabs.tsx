import { Button } from "@/components/ui/button";
import { ServiceViewMode } from "..";
import { useLastUriParam } from "@/hooks/useLastUriParam";
import { Link, useParams } from "react-router-dom";
import { CreateUpdateServiceButton } from "./CreateUpdateButton";

interface Props {
  mode: ServiceViewMode;
}

function CreateUpdateServiceTabs({ mode }: Props) {
  const tab = useLastUriParam();
  const { serviceId } = useParams();
  const isInCreateMode = mode === ServiceViewMode.Create;
  const isInUpdateMode = mode === ServiceViewMode.Update;

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
            <Button variant={tab === "settings" ? "lightGreen" : "ghost"}>
              Settings
            </Button>
          </Link>
          <Link to={`/ui/services/${serviceId}/logs`}>
            <Button variant={tab === "logs" ? "lightGreen" : "ghost"}>
              Logs
            </Button>
          </Link>
        </div>
      )}

      <CreateUpdateServiceButton isInCreateMode={isInCreateMode} />
    </div>
  );
}

export default CreateUpdateServiceTabs;
