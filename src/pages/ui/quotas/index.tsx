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
      console.error("Error fetching user quota:", error);
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
            uid: user.user_id!,
            cpuUsed: user.resources.cpu.used,
            cpuMax: user.resources.cpu.max,
            memoryUsed: user.resources.memory.used,
            memoryMax: user.resources.memory.max,
            })
          )
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
              accessor: (row) => (row.cpuUsed / 1000).toString(),
              sortBy: "cpuUsed",
            },
            {
              header: "CPU Max",
              accessor: (row) => (row.cpuMax / 1000).toString(),
              sortBy: "cpuMax",
            },
            {
              header: "Memory Used",
              accessor: (row) => bytesSizeToHumanReadable(row.memoryUsed),
              sortBy: "memoryUsed",
            },
            {
              header: "Memory Max",
              accessor: (row) => bytesSizeToHumanReadable(row.memoryMax),
              sortBy: "memoryMax",
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