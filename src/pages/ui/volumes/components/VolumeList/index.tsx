import DeleteDialog from "@/components/DeleteDialog";
import ResponsiveOwnerField from "@/components/ResponsiveOwnerField";
import GenericTable from "@/components/Table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { useVolumes } from "@/contexts/Volumes/VolumesContext";
import { isUserOscar } from "@/lib/utils";
import { ManagedVolume } from "@/pages/ui/services/models/service";
import OscarColors from "@/styles";
import { AlertCircle, ExternalLinkIcon, LoaderPinwheel, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const statusColors: Record<string, string> = {
  ready: "bg-green-100 text-green-700 border-green-300",
  in_use: "bg-blue-100 text-blue-700 border-blue-300",
  pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
  error: "bg-red-100 text-red-700 border-red-300",
  deleting: "bg-orange-100 text-orange-700 border-orange-300",
  deleted: "bg-gray-100 text-gray-700 border-gray-300",
};

const creationModeColors: Record<string, string> = {
  api: "bg-teal-100 text-teal-700 border-teal-300",
  service: "bg-purple-100 text-purple-700 border-purple-300",
};

function formatBadge(value: string, colors: Record<string, string>) {
  const normalized = value?.toLowerCase() || "unknown";
  const badgeColors =
    colors[normalized] || "bg-gray-100 text-gray-700 border-gray-300";

  return (
    <span
      className={`font-bold px-2 py-1 rounded-full text-xs border ${badgeColors}`}
    >
      {normalized.toUpperCase()}
    </span>
  );
}

export default function VolumeList() {
  const { authData } = useAuth();
  const {
    volumes,
    volumesAreLoading,
    deleteVolume,
    volumesFilter,
    volumesLoadingError,
  } = useVolumes();
  const [itemsToDelete, setItemsToDelete] = useState<ManagedVolume[]>([]);
  const [filteredVolumes, setFilteredVolumes] =
    useState<ManagedVolume[]>(volumes);

  useEffect(() => {
    let nextVolumes = volumes;

    if (volumesFilter.myVolumes) {
      nextVolumes = nextVolumes.filter((volume) => {
        const owner = volume.owner_user || "";
        return (
          owner === authData.egiSession?.sub || isUserOscar(authData, { owner })
        );
      });
    }

    if (volumesFilter.query) {
      nextVolumes = nextVolumes.filter((volume) => {
        const fieldToFilter =
          volumesFilter.by === "name"
            ? volume.name
            : volumesFilter.by === "owner"
            ? volume.owner_user || ""
            : volume.created_by_service || "";
        const query = volumesFilter.query.toLowerCase();
        return fieldToFilter.toLowerCase().includes(query);
      });
    }

    setFilteredVolumes(nextVolumes);
  }, [authData, volumes, volumesFilter]);

  function loadingErrorView() {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Alert variant="destructive" className="max-w-md bg-red-50 text-red-400">
          <div className="flex flex-col items-center text-center">
          <AlertCircle className="h-6 w-6 mb-2" />
          <AlertTitle>Failed to load volumes</AlertTitle>
          <AlertDescription className="mt-1 text-sm">
            Could not retrieve volumes data due to an unexpected error. Contact your administrator or try again later.
          </AlertDescription>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <DeleteDialog
        isOpen={itemsToDelete.length > 0}
        onClose={() => setItemsToDelete([])}
        onDelete={() => {
          itemsToDelete.forEach((volume) => {
            void deleteVolume(volume.name);
          });
        }}
        itemNames={itemsToDelete.map((volume) => volume.name)}
      />
      {volumesAreLoading ? (
        <div className="flex items-center justify-center h-screen">
          <LoaderPinwheel
            className="animate-spin"
            size={60}
            color={OscarColors.Green3}
          />
        </div>
      )
      : volumesLoadingError ? (
        loadingErrorView()
      ) : (
        <GenericTable<ManagedVolume>
          idKey="name"
          data={filteredVolumes}
          columns={[
            {
              header: "Name",
              accessor: "name",
              sortBy: "name",
            },
            {
              header: "Owner",
              accessor: (row) => (
                <ResponsiveOwnerField
                  owner={row.owner_user || "oscar"}
                  sub={row.owner_user || "oscar"}
                />
              ),
              sortBy: "owner_user",
            },
            {
              header: "Size",
              accessor: (row) => row.size || "-",
              sortBy: "size",
            },
            {
              header: "Service",
              accessor: (row) => (
                <>
                  {row.attachments?.length ? (
                    <div className="flex flex-col gap-1">
                      {row.attachments.map((attachment) => (
                        <Link
                          key={attachment.service_name}
                          to={`/ui/services/${attachment.service_name}/settings`}
                          className="grid grid-cols-[auto_1fr] no-underline hover:underline underline-offset-2 border-gray-400"
                        >
                          <span className="truncate min-w-[70px]">
                            {attachment.service_name}
                          </span>
                          <ExternalLinkIcon
                            size={12}
                            className="self-center ml-[2px]"
                          />
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <span></span>
                  )}
                </>
              ),
              sortBy: "name",
            },
            {
              header: "Status",
              accessor: (row) =>
                formatBadge(row.status?.phase || "unknown", statusColors),
              sortBy: "name",
            },
            {
              header: "Mode",
              accessor: (row) =>
                formatBadge(
                  row.creation_mode || "unknown",
                  creationModeColors
                ),
              sortBy: "creation_mode",
            },
          ]}
          actions={[
            {
              button: (volume) => {
                return (
                  <Button
                    variant="link"
                    size="icon"
                    onClick={() => {
                      setItemsToDelete([...itemsToDelete, volume]);
                    }}
                  >
                    <Trash color={OscarColors.Red} />
                  </Button>
                );
              },
            },
          ]}
          bulkActions={[
            {
              button: (items) => {
                return (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        className="mt-[2px] ml-[4px]"
                        onClick={() => setItemsToDelete(items)}
                        variant={"destructive"}
                      >
                        <Trash className="w-4 h-4 mr-2" />
                        Delete Volumes
                      </Button>
                    </TooltipTrigger>
                  </Tooltip>
                );
              },
            },
          ]}
        />
      )}
    </>
  );
}
