import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { OscarStyles } from "@/styles";
import { Button } from "../ui/button";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { AnimatePresence, motion } from "framer-motion";

export type ColumnDef<T> = {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
};

type ActionButton<T> = {
  button: (item: T) => React.ReactNode;
};

type GenericTableProps<T> = {
  data: T[];
  columns: ColumnDef<T>[];
  actions?: ActionButton<T>[];
  bulkActions?: ActionButton<T[]>[];
  globalActions?: ActionButton<T[]>[];
  idKey: keyof T;
};

function GenericTable<T extends object>({
  data,
  columns,
  actions,
  bulkActions,
  globalActions,
  idKey,
}: GenericTableProps<T>) {
  const [selectedRows, setSelectedRows] = useState<Set<T[typeof idKey]>>(
    new Set()
  );

  useEffect(() => {
    setSelectedRows(new Set());
  }, [data.length]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalPages = Math.ceil(data.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  const [sortConfig, setSortConfig] = useState<{
    key: keyof T;
    direction: "asc" | "desc";
  } | null>(null);

  const sortedData = React.useMemo(() => {
    if (sortConfig !== null) {
      return [...data].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return data;
  }, [data, sortConfig]);

  const paginatedData = sortedData.slice(startIndex, endIndex) ?? [];

  const handleHeaderClick = (column: ColumnDef<T>) => {
    if (sortConfig?.key === column.accessor) {
      setSortConfig({
        key: column.accessor as keyof T,
        direction: sortConfig.direction === "asc" ? "desc" : "asc",
      });
    } else {
      setSortConfig({ key: column.accessor as keyof T, direction: "asc" });
    }
  };

  const toggleAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedData.map((item) => item[idKey])));
    }
  };

  const toggleRow = (id: T[typeof idKey]) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  return (
    <div className="relative flex flex-col flex-grow flex-basis-0 overflow-y-auto">
      <div className="flex-grow">
        <Table>
          <TableHeader className="sticky top-0 z-10 h-[34px]">
            <TableRow
              style={{
                background: "white",
                padding: 0,
                height: "34px",
                borderBottom: OscarStyles.border,
              }}
            >
              <TableHead
                className="w-[50px] h-[34px]"
                style={{ height: "34px" }}
              >
                <Checkbox
                  checked={
                    paginatedData.length > 0 &&
                    selectedRows.size === paginatedData.length
                  }
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              {columns.map((column, index) => (
                <TableHead
                  key={index}
                  style={{ height: "34px" }}
                  onClick={() => handleHeaderClick(column)}
                >
                  <div className="flex items-center gap-1 cursor-pointer">
                    {column.header}
                    {sortConfig?.key === column.accessor &&
                      (sortConfig.direction === "asc" ? (
                        <ArrowDownAZ size={20} />
                      ) : (
                        <ArrowUpAZ size={20} />
                      ))}
                  </div>
                </TableHead>
              ))}
              {actions && (
                <TableHead
                  className="text-right pr-6"
                  style={{ height: "34px" }}
                >
                  Actions
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData?.map((item, rowIndex) => (
              <TableRow key={rowIndex}>
                <TableCell>
                  <Checkbox
                    checked={selectedRows.has(item[idKey])}
                    onCheckedChange={() => toggleRow(item[idKey])}
                  />
                </TableCell>
                {columns.map((column, colIndex) => (
                  <TableCell key={colIndex}>
                    {typeof column.accessor === "function"
                      ? column.accessor(item)
                      : (item[column.accessor] as React.ReactNode)}
                  </TableCell>
                ))}
                {actions && (
                  <TableCell>
                    <div className="flex justify-end items-center">
                      {actions.map((action, index) => (
                        <div key={index}>{action.button(item)}</div>
                      ))}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div
        style={{
          borderTop: OscarStyles.border,
          position: "sticky",
          bottom: 0,
          left: 0,
          background: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "4px",
        }}
      >
        <div className="w-max flex items-center gap-2 pl-2">
          <span className="w-max text-nowrap">Rows per page</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => setPageSize(Number(value))}
          >
            <SelectTrigger className="w-[75px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <AnimatePresence mode="popLayout">
          {globalActions && (
            <motion.div
              key="global-actions"
              layout
              layoutId="global-actions"
              initial={{
                opacity: 0,
                x: -20,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              exit={{
                opacity: 0,
                x: 20,
              }}
              transition={{
                duration: 0.2,
                ease: "easeOut",
              }}
              className="flex items-center gap-1"
            >
              {globalActions.map((action, index) => {
                return (
                  <motion.div layout key={index}>
                    {action.button(data)}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
          {bulkActions && selectedRows.size > 0 && (
            <motion.div
              key="bulk-actions"
              layoutId="bulk-actions"
              initial={{
                opacity: 0,
                x: -20,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              exit={{
                opacity: 0,
                x: 20,
              }}
              transition={{
                duration: 0.2,
                ease: "easeOut",
              }}
              className="flex items-center gap-1"
            >
              {bulkActions.map((action, index) => {
                const idKeys = Array.from(selectedRows.values());
                const items = data.filter((item) =>
                  idKeys.includes(item[idKey])
                );

                return (
                  <motion.div layout key={index}>
                    {action.button(items)}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            disabled={currentPage === 1}
            onClick={() => {
              setCurrentPage(1);
            }}
          >
            <ChevronFirst />
          </Button>
          <Button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            size="icon"
            variant="ghost"
          >
            <ChevronLeft />
          </Button>
          <span>{`Page ${currentPage} of ${totalPages}`}</span>
          <Button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            size="icon"
            variant="ghost"
          >
            <ChevronRight />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(totalPages)}
          >
            <ChevronLast />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default GenericTable;
