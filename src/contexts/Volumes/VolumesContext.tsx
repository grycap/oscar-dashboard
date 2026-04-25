import createVolumesApi from "@/api/volumes/createVolumesApi";
import deleteVolumesApi from "@/api/volumes/deleteVolumesApi";
import getVolumesApi from "@/api/volumes/getVolumesApi";
import { alert } from "@/lib/alert";
import React, { createContext, useContext, useState } from "react";
import {
  ManagedVolume,
  ManagedVolumeCreateRequest,
} from "@/pages/ui/services/models/service";
import { errorMessage } from "@/lib/error";

interface VolumesFilterProps {
  myVolumes: boolean;
  query: string;
  by: VolumeFilterBy;
}

export enum VolumeFilterBy {
  NAME = "name",
  OWNER = "owner",
  SERVICE = "service",
}

export type VolumesProviderData = {
  volumesFilter: VolumesFilterProps;
  setVolumesFilter: (filter: VolumesFilterProps) => void;
  volumes: ManagedVolume[];
  volumesAreLoading: boolean;
  volumesLoadingError: boolean;
  setVolumes: (volumes: ManagedVolume[]) => void;
  updateVolumes: () => Promise<void>;
  createVolume: (volume: ManagedVolumeCreateRequest) => Promise<void>;
  deleteVolume: (volumeName: string) => Promise<void>;
};

export const VolumesContext = createContext({} as VolumesProviderData);

export const VolumesProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [volumes, setVolumes] = useState<ManagedVolume[]>([]);
  const [volumesAreLoading, setVolumesAreLoading] = useState<boolean>(false);
  const [volumesLoadingError, setVolumesLoadingError] = useState<boolean>(false);
  const [volumesFilter, setVolumesFilter] = useState<VolumesFilterProps>({
    myVolumes: false,
    query: "",
    by: VolumeFilterBy.NAME,
  });

  async function updateVolumes() {
    try {
      setVolumesLoadingError(false);
      setVolumesAreLoading(true);
      const nextVolumes = await getVolumesApi();
      setVolumes(nextVolumes);
    } catch (error) {
      console.error("Error fetching volumes:", error);
      alert.error(`Error fetching volumes: ${errorMessage(error)}`);
      setVolumesLoadingError(true);
    } finally {
      setVolumesAreLoading(false);
    }
  }

  async function createVolume(volume: ManagedVolumeCreateRequest) {
    try {
      await createVolumesApi(volume);
      alert.success("Volume created successfully");
    } catch (error) {
      console.error(error);
      alert.error("Error creating volume");
    }

    await updateVolumes();
  }

  async function deleteVolume(volumeName: string) {
    try {
      await deleteVolumesApi(volumeName);
      alert.success("Volume deleted successfully");
    } catch (error) {
      console.error(error);
      alert.error("Error deleting volume");
    }

    await updateVolumes();
  }

  return (
    <VolumesContext.Provider
      value={{
        volumesFilter,
        setVolumesFilter,
        volumes,
        volumesAreLoading,
        volumesLoadingError,
        setVolumes,
        updateVolumes,
        createVolume,
        deleteVolume,
      }}
    >
      {children}
    </VolumesContext.Provider>
  );
};

export function useVolumes() {
  return useContext(VolumesContext);
}
