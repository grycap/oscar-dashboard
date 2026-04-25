import getUserQuotaApi from "@/api/quotas/getQuotaApi";
import GenericTable from "@/components/Table";
import GenericTopbar from "@/components/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { bytesSizeToHumanReadable } from "@/lib/utils";
import { ClusterUserQuota } from "@/models/clusterUserQuota";
import { Pencil, Search } from "lucide-react";
import { useState } from "react";
import EditPopover from "./components/EditPopover";
import ResponsiveOwnerField from "@/components/ResponsiveOwnerField";
import { errorMessage } from "@/lib/error";

type QuotaRow = {
  uid: string;
  cpuUsed?: number;
  cpuMax?: number;
  memoryUsed?: number;
  memoryMax?: number;
  volumeDiskUsed?: string;
  volumeDiskMax?: string;
  volumesUsed?: string;
  volumesMax?: string;
};

const formatCores = (millicores?: number) =>
  millicores === undefined ? "-" : (millicores / 1000).toString();

const formatBytes = (bytes?: number) =>
  bytes === undefined ? "-" : bytesSizeToHumanReadable(bytes);

const formatQuota = (value?: string) => value || "-";

function Quotas() {
  const [users, setUsers] = useState(Array<ClusterUserQuota>());
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ClusterUserQuota>();

  async function searchUsersByUID(uid: string) {
    try {
      const quota = await getUserQuotaApi(uid);
      setUsers([quota]);
    } catch (error) {
      console.error(`Error fetching user quota: ${errorMessage(error)}`);
      setUsers([]);
    }
  }

  return (
    <div className="w-full h-full overflow-auto">
      <GenericTopbar defaultHeader={{title: "Quotas", linkTo: "/ui/quotas"}} 
        secondaryRow={
          <div className="grid grid-cols-[1fr_auto] w-full px-2 py-1 gap-2">
            <Input
              placeholder="Search services by UID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              endIcon={<Search size={16} />}
            />
            <Button onClick={() => searchUsersByUID(searchQuery)}>Search</Button>
          </div>
        }
      />

      <GenericTable
        data={users.map((user) => ({
            uid: user.user_id ?? "",
            cpuUsed: user.resources?.cpu.used,
            cpuMax: user.resources?.cpu.max,
            memoryUsed: user.resources?.memory.used,
            memoryMax: user.resources?.memory.max,
            volumeDiskUsed: user.volumes?.disk.used,
            volumeDiskMax: user.volumes?.disk.max,
            volumesUsed: user.volumes?.volumes.used,
            volumesMax: user.volumes?.volumes.max,
            })
          ) as QuotaRow[]
        }
        idKey={"uid"}
        columns={
          [
            {
              header: "UID",
              accessor: (row) => <ResponsiveOwnerField owner={row.uid} copy={true} />,
              sortBy: "uid",
            },
            {
              header: "CPU Used",
              accessor: (row) => formatCores(row.cpuUsed),
              sortBy: "cpuUsed",
            },
            {
              header: "CPU Max",
              accessor: (row) => formatCores(row.cpuMax),
              sortBy: "cpuMax",
            },
            {
              header: "Memory Used",
              accessor: (row) => formatBytes(row.memoryUsed),
              sortBy: "memoryUsed",
            },
            {
              header: "Memory Max",
              accessor: (row) => formatBytes(row.memoryMax),
              sortBy: "memoryMax",
            },
            {
              header: "Volume Disk Used",
              accessor: (row) => formatQuota(row.volumeDiskUsed),
              sortBy: "volumeDiskUsed",
            },
            {
              header: "Volume Disk Max",
              accessor: (row) => formatQuota(row.volumeDiskMax),
              sortBy: "volumeDiskMax",
            },
            {
              header: "Volumes Used",
              accessor: (row) => formatQuota(row.volumesUsed),
              sortBy: "volumesUsed",
            },
            {
              header: "Volumes Max",
              accessor: (row) => formatQuota(row.volumesMax),
              sortBy: "volumesMax",
            },
          ]
        }
        actions={[
          {
            button: (item) => (
              <>
              <Button variant={"link"} size="icon" tooltipLabel="Edit" onClick={() => {
                setSelectedUser(users.find((u) => u.user_id === item.uid));
                setIsEditOpen(true);
              }}>
                <Pencil />
              </Button>
              
              </>
            )
          },
        ]}
      />
      {selectedUser && <EditPopover isOpen={isEditOpen} setIsOpen={setIsEditOpen} user={selectedUser} />}
    </div>
  );
  
}

export default Quotas;
