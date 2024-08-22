import { Button } from "@/components/ui/button";
import { ServiceViewMode } from "..";
import { useLastUriParam } from "@/hooks/useLastUriParam";
import { Link, useParams } from "react-router-dom";

interface Props {
  mode: ServiceViewMode;
}

function CreateUpdateServiceTabs({ mode }: Props) {
  const tab = useLastUriParam();
  const { serviceId } = useParams();
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
          <Link to={`/ui/services/${serviceId}/settings`}>
            <Button variant={tab === "settings" ? "mainGreen" : "ghost"}>
              Settings
            </Button>
          </Link>
          <Link to={`/ui/services/${serviceId}/logs`}>
            <Button variant={tab === "logs" ? "mainGreen" : "ghost"}>
              Logs
            </Button>
          </Link>
        </>
      )}
    </div>
  );
}

export default CreateUpdateServiceTabs;
