import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useServicesContext from "@/pages/ui/services/context/ServicesContext";
import { Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function EnviromentVariables() {
  const { formService, setFormService } = useServicesContext();

  const initialArray = useMemo(() => {
    const variables = formService.environment?.Variables;
    const array = variables
      ? Object.entries(variables).map(([key, value]) => {
          return {
            key,
            value,
          };
        })
      : [];

    if (array.length === 0) {
      array.push({ key: "", value: "" });
    }

    return array;
  }, [formService]);

  const [variablesArray, setVariablesArray] = useState(initialArray);

  useEffect(() => {
    setFormService((prev) => ({
      ...prev,
      environment: {
        ...prev.environment,
        Variables: variablesArray.reduce((acc, curr) => {
          acc[curr.key] = curr.value;
          return acc;
        }, {} as Record<string, string>),
      },
    }));
  }, [variablesArray]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "9px",
      }}
    >
      {variablesArray.map((variable, index) => (
        <div
          key={index}
          style={{ display: "flex", gap: "5px", alignItems: "center" }}
        >
          <Input
            value={variable.key}
            onChange={(e) => {
              const newVariablesArray = [...variablesArray];
              newVariablesArray[index].key = e.target.value;
              setVariablesArray(newVariablesArray);
            }}
            placeholder="Variable name"
          />
          <Input
            type="password"
            value={variable.value}
            onFocus={(e) => (e.target.type = "text")}
            onBlur={(e) => (e.target.type = "password")}
            style={{ width: 300 }}
            onChange={(e) => {
              const newVariablesArray = [...variablesArray];
              newVariablesArray[index].value = e.target.value;
              setVariablesArray(newVariablesArray);
            }}
            placeholder="Value"
          />
          {variablesArray.length > 1 && (
            <Button
              size={"icon"}
              variant={"ghost"}
              onClick={() => {
                const newVariablesArray = variablesArray.filter(
                  (_, i) => i !== index
                );
                setVariablesArray(newVariablesArray);
              }}
            >
              <X size={16} />
            </Button>
          )}
        </div>
      ))}
      <Button
        size={"sm"}
        style={{
          width: "max-content",
        }}
        onClick={() => {
          setVariablesArray([...variablesArray, { key: "", value: "" }]);
        }}
      >
        <Plus className="h-4 w-4 mr-2" /> Add Variable
      </Button>
    </div>
  );
}

export default EnviromentVariables;