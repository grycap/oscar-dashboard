
import { Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';

function InfoPopUp({ content }: { content: React.ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" tooltipLabel="More info" 
          className="flex items-center gap-2 hover:bg-transparent p-0 m-0">
          <Info size={18} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-screen max-w-sm">
        <div className="w-full ">
          {content}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default InfoPopUp;