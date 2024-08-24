import { useState } from "react";
import ServiceFormCell from "../FormCell";
import AddProviderButton from "./components/AddProviderButton";
import useServiceProviders from "./hooks/useServiceProviders";
import { StorageProvider } from "@/pages/ui/services/models/service";
import ProvidersListItem from "./components/ProvidersListItem";

function ServicesStorageTab() {
  const { providers, setProviders } = useServiceProviders();

  const [selectedProvider, setSelectedProvider] =
    useState<StorageProvider | null>(null);

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
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            width: "100%",
            gap: "10px",
          }}
        >
          {providers.map((item, index) => (
            <ProvidersListItem key={index} provider={item} />
          ))}
        </div>
      </ServiceFormCell>
    </div>
  );
}

export default ServicesStorageTab;
