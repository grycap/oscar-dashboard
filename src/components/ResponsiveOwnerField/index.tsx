import { useAuth } from "@/contexts/AuthContext";
import { alert } from "@/lib/alert";
import { isUserOscar } from "@/lib/utils";
import { Copy } from "lucide-react";

export default function ResponsiveOwnerField({ owner, sub = owner, copy = true }: { owner: string, sub?: string, copy?: boolean }) {
  const {authData} = useAuth();
  return (
    <div
      className={`grid grid-cols-[auto_1fr] no-underline ${copy && 'hover:underline'} underline-offset-2 cursor-pointer`}
      onClick={() => { if (copy) { navigator.clipboard.writeText(sub ? sub : "oscar"); alert.success("Owner copied to clipboard"); } }}
    >
    {sub !== authData.egiSession?.sub && !isUserOscar(authData, {owner: sub}) ?
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