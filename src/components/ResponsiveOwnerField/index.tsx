import { useAuth } from "@/contexts/AuthContext";
import { alert } from "@/lib/alert";
import { isUserOscar } from "@/lib/utils";
import { Copy } from "lucide-react";

export default function ResponsiveOwnerField({ owner, copy = true }: { owner: string, copy?: boolean }) {
  const {authData} = useAuth();
  return (
    <div
      className={`grid grid-cols-[auto_1fr] no-underline ${copy && 'hover:underline'} underline-offset-2 cursor-pointer`}
      onClick={() => { if (copy) { navigator.clipboard.writeText(owner ? owner : "oscar"); alert.success("Owner copied to clipboard"); } }}
    >
    {owner !== authData.egiSession?.sub && !isUserOscar(authData, {owner: owner}) ?
    <>
      <span className="truncate min-w-[40px]">
        {owner}
      </span>
      {copy && <Copy size={12} className="self-center ml-[2px]" />}
    </>
    :
    <>
      <span className="truncate min-w-[40px]">
        {"You"}
      </span>
      {copy && <Copy size={12} className="self-center -ml-[14px]" />}
      </>
    }
  </div>
  )
  
}