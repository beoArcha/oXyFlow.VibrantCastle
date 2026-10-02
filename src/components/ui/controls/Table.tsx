import React from "react";
import { cn } from "@lib/utils";

export const Table = React.memo(
  React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
    function Table({ className, ...props }, ref) {
      return (
        <div className="relative w-full overflow-auto custom-scrollbar border border-stone-800 rounded-lg">
          <table
            ref={ref}
            className={cn(
              "w-full caption-bottom text-xs font-mono border-collapse text-left text-stone-300",
              className
            )}
            {...props}
          />
        </div>
      );
    }
  )
);
Table.displayName = "Table";

export const TableHeader = React.memo(
  React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
    function TableHeader({ className, ...props }, ref) {
      return (
        <thead
          ref={ref}
          className={cn("bg-stone-900/90 text-stone-400 border-b border-stone-800", className)}
          {...props}
        />
      );
    }
  )
);
TableHeader.displayName = "TableHeader";

export const TableBody = React.memo(
  React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
    function TableBody({ className, ...props }, ref) {
      return (
        <tbody
          ref={ref}
          className={cn("divide-y divide-stone-900/80 [&_tr:last-child]:border-0", className)}
          {...props}
        />
      );
    }
  )
);
TableBody.displayName = "TableBody";

export const TableFooter = React.memo(
  React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
    function TableFooter({ className, ...props }, ref) {
      return (
        <tfoot
          ref={ref}
          className={cn("border-t border-stone-800 bg-stone-900/50 font-medium text-stone-400", className)}
          {...props}
        />
      );
    }
  )
);
TableFooter.displayName = "TableFooter";

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  isSelected?: boolean;
}

export const TableRow = React.memo(
  React.forwardRef<HTMLTableRowElement, TableRowProps>(
    function TableRow({ className, isSelected, ...props }, ref) {
      return (
        <tr
          ref={ref}
          data-state={isSelected ? "selected" : undefined}
          className={cn(
            "border-b border-stone-900/80 transition-colors hover:bg-stone-900/50",
            isSelected && "bg-amber-950/25",
            className
          )}
          {...props}
        />
      );
    }
  )
);
TableRow.displayName = "TableRow";

export const TableHead = React.memo(
  React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
    function TableHead({ className, ...props }, ref) {
      return (
        <th
          ref={ref}
          className={cn(
            "h-8 px-2 text-left align-middle font-bold text-stone-400 text-xs tracking-wider",
            className
          )}
          {...props}
        />
      );
    }
  )
);
TableHead.displayName = "TableHead";

export const TableCell = React.memo(
  React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
    function TableCell({ className, ...props }, ref) {
      return (
        <td
          ref={ref}
          className={cn("p-1.5 align-middle text-stone-300", className)}
          {...props}
        />
      );
    }
  )
);
TableCell.displayName = "TableCell";

export const TableCaption = React.memo(
  React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
    function TableCaption({ className, ...props }, ref) {
      return (
        <caption
          ref={ref}
          className={cn("mt-2 text-xs text-stone-500", className)}
          {...props}
        />
      );
    }
  )
);
TableCaption.displayName = "TableCaption";

export default Table;
