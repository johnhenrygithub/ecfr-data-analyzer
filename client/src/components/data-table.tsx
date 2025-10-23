import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  mono?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  testId?: string;
}

export function DataTable<T extends Record<string, any>>({ columns, data, testId }: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (columnHeader: string, accessor: keyof T | ((row: T) => React.ReactNode)) => {
    if (typeof accessor === 'function') return;
    
    if (sortColumn === columnHeader) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnHeader);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn) return 0;
    
    const column = columns.find(col => col.header === sortColumn);
    if (!column || typeof column.accessor === 'function') return 0;
    
    const aValue = a[column.accessor];
    const bValue = b[column.accessor];
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    const aStr = String(aValue);
    const bStr = String(bValue);
    return sortDirection === 'asc' 
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr);
  });

  return (
    <div className="rounded-md border" data-testid={testId}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={index} className={column.mono ? 'font-mono' : ''}>
                {column.sortable && typeof column.accessor !== 'function' ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 -ml-2"
                    onClick={() => handleSort(column.header, column.accessor)}
                    data-testid={`button-sort-${column.header.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {column.header}
                    {sortColumn === column.header ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="ml-2 h-4 w-4" />
                      ) : (
                        <ArrowDown className="ml-2 h-4 w-4" />
                      )
                    ) : (
                      <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                    )}
                  </Button>
                ) : (
                  column.header
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-12 text-muted-foreground">
                No data available
              </TableCell>
            </TableRow>
          ) : (
            sortedData.map((row, rowIndex) => (
              <TableRow 
                key={rowIndex}
                data-testid={`row-data-${rowIndex}`}
              >
                {columns.map((column, colIndex) => (
                  <TableCell 
                    key={colIndex} 
                    className={column.mono ? 'font-mono text-sm' : ''}
                    data-testid={`cell-${column.header.toLowerCase().replace(/\s+/g, '-')}-${rowIndex}`}
                  >
                    {typeof column.accessor === 'function' 
                      ? column.accessor(row)
                      : String(row[column.accessor] ?? '')
                    }
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
