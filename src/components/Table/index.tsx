import React, { useState } from "react";
import "./style.css";
import { Checkbox } from "../ui/checkbox";

type TableColumn<T> = {
  title: React.ReactNode | ((data: T[]) => React.ReactNode);
  key?: keyof T;
  renderCell?: (value: T[keyof T], row: T, index: number) => React.ReactNode;
};

type TableProps<T> = {
  data: T[];
  columns: TableColumn<T>[];
  checkbox?: boolean;
};

function Table<T>(props: TableProps<T>) {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const isAllSelected =
    props.data.length > 0 && selectedRows.size === props.data.length;
  const isSomeSelected =
    selectedRows.size > 0 && selectedRows.size < props.data.length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelectedRows = new Set(props.data.map((_, index) => index));
      setSelectedRows(newSelectedRows);
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (index: number, checked: boolean) => {
    const newSelectedRows = new Set(selectedRows);
    if (checked) {
      newSelectedRows.add(index);
    } else {
      newSelectedRows.delete(index);
    }
    setSelectedRows(newSelectedRows);
  };

  return (
    <table className="oscar-table" width={"100%"}>
      <thead className="sticky-thead">
        <tr>
          {props.checkbox && (
            <th style={{ width: "64px", padding: "0 20px" }}>
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
              />
            </th>
          )}
          {props.columns.map((column, colIndex) => (
            <th key={colIndex}>
              {typeof column.title === "function"
                ? column.title(props.data)
                : column.title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {props.data.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {props.checkbox && (
              <td style={{ width: "64px", padding: "0 20px" }}>
                <Checkbox
                  checked={selectedRows.has(rowIndex)}
                  onCheckedChange={(checked) => {
                    handleSelectRow(rowIndex, checked === true);
                  }}
                />
              </td>
            )}
            {props.columns.map((column, colIndex) => {
              const value = column.key && row[column.key];

              return (
                <td key={colIndex}>
                  {column.renderCell
                    ? column.renderCell(value!, row, rowIndex)
                    : (value as string)}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default Table;
