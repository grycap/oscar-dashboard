import {
  Card,
  CardTitle,
} from "@/components/ui/card";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

function ExpandCard({ title, className, children }: { title: string; className?: string; children: React.ReactNode }) {
  const [expandedSections, setExpandedSections] = useState(false);
  

  return (
    <Card className={className}>
      <div
        onClick={() => setExpandedSections(!expandedSections)}
        className="cursor-pointer hover:bg-gray-100 transition px-4 py-3 rounded-md flex justify-between items-center"
      >
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {expandedSections ? <ChevronDown /> : <ChevronRight />}
      </div>

      {expandedSections && (
        <>
          {children}
        </>
      )}
    </Card>
  );
  
}

export default ExpandCard;