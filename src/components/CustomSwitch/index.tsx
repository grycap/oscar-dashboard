import { Label } from "../ui/label";

function CustomSwitch({variant = "default", title,  checked, onChange }: { variant?: "default" | "checkbox"; title: string; checked: boolean; onChange: () => void }) {
  return (
    <Label className="inline-flex items-center cursor-pointer">
      <input type="checkbox" value="" checked={checked} className="sr-only peer" onChange={onChange} />
      {variant === "default" && (
        <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600 dark:peer-checked:bg-teal-600"></div>
      )}
      {variant === "checkbox" && (
        <div className="relative flex h-5 w-5 items-center justify-center rounded border border-gray-300 bg-transparent shadow-sm transition-all duration-200 ease-in-out dark:border-gray-600 dark:bg-transparent peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 peer-checked:border-teal-600 peer-checked:bg-transparent peer-checked:[&_svg]:opacity-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-0 text-teal-600 transition-opacity duration-200 ease-in-out" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="4 11 8 15 16 6" />
          </svg>
        </div>
      )}
      <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">{title}</span>
    </Label>
  )
}

export default CustomSwitch;