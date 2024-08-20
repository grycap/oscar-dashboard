import { useLastUriParam } from "@/hooks/useLastUriParam";
import { useMemo, useState } from "react";
import { ServiceTopbarMode } from "../Topbar";
import ServiceFormTabs from "./components/ServiceFormTabs";
import { ServiceFormTab } from "../../models/service";

function ServiceForm() {
  const path = useLastUriParam();

  const formMode = useMemo(() => {
    const isInCreateMode = path === "create";

    if (isInCreateMode) return ServiceTopbarMode.Create;

    return ServiceTopbarMode.Update;
  }, [path]);

  const [formTab, setFormTab] = useState(ServiceFormTab.General);

  return (
    <>
      <ServiceFormTabs tab={formTab} setTab={setFormTab} />
    </>
  );
}

export default ServiceForm;
