import getVolumesApi from "@/api/volumes/getVolumesApi";
import { ManagedVolume } from "@/pages/ui/services/models/service";
import { useEffect, useState } from "react";

function useGetVolumes(enabled: boolean = true) {
  const [ volumes, setVolumes ] = useState<ManagedVolume[]>([]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const fetchVolumes = async () => {
      const volumes = await getVolumesApi();
      setVolumes(volumes);
    };
    fetchVolumes();
  }, [enabled]);

  return volumes;
}

export default useGetVolumes;