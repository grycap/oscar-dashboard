import { Button } from "@/components/ui/button";
import ServiceFormCell from "../FormCell";
import { Plus } from "lucide-react";
import AddProviderButton from "./components/AddProviderButton";

function ServicesStorageTab() {
  return (
    <div
      style={{
        flexGrow: 1,
        flexBasis: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <ServiceFormCell
        title="Storage configuration"
        subtitle="Set up the credentials of the storage providers"
        button={<AddProviderButton />}
      />
    </div>
  );
}

export default ServicesStorageTab;