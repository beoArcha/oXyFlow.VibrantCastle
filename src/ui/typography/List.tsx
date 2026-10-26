import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@lib/utils";

export const listVariants = cva("min-w-0 transition-colors", {
  variants: {
    spacing: {
      dense: "space-y-1",
      normal: "space-y-1.5",
      relaxed: "space-y-2.5",
    },
    columns: {
      1: "flex flex-col",
      2: "grid grid-cols-1 sm:grid-cols-2 gap-1.5 space-y-0",
      3: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 space-y-0",
    },
  },
  defaultVariants: {
    spacing: "normal",
    columns: 1,
  },
});

export type ListVariant = "diamond" | "dash" | "disc" | "decimal" | "none";
export type ListSpacing = NonNullable<VariantProps<typeof listVariants>["spacing"]>;
export type ListColumns = NonNullable<VariantProps<typeof listVariants>["columns"]>;

export interface ListContextValue {
  readonly variant: ListVariant;
  readonly markerColor?: string;
}

export const ListContext = React.createContext<ListContextValue>({
  variant: "disc",
});

export interface ListProps
  extends React.HTMLAttributes<HTMLUListElement | HTMLOListElement> {
  /** Underlying HTML tag to render. Defaults to 'ul' unless variant is 'decimal'. */
  as?: "ul" | "ol";
  /** Bullet marker style */
  variant?: ListVariant;
  /** Vertical item spacing */
  spacing?: ListSpacing;
  /** Multi-column grid distribution */
  columns?: ListColumns;
  /** Marker accent color class (e.g. 'text-amber-400') */
  markerColor?: string;
}

/**
 * Standard semantic List primitive supporting gothic markers, multi-column grids, and density spacing.
 */
export const List = React.memo(
  React.forwardRef<HTMLUListElement | HTMLOListElement, ListProps>(function List(
    {
      as,
      variant = "disc",
      spacing = "normal",
      columns = 1,
      markerColor,
      children,
      className,
      ...props
    },
    ref
  ) {
    const Tag = as ?? (variant === "decimal" ? "ol" : "ul");
    const isDecimal = variant === "decimal" || Tag === "ol";

    const contextValue = React.useMemo<ListContextValue>(
      () => ({
        variant: isDecimal ? "decimal" : variant,
        markerColor,
      }),
      [isDecimal, variant, markerColor]
    );

    return (
      <ListContext.Provider value={contextValue}>
        {React.createElement(
          Tag,
          {
            ref: ref as React.Ref<HTMLUListElement & HTMLOListElement>,
            "data-slot": "list",
            "data-variant": variant,
            className: cn(
              listVariants({ spacing, columns }),
              variant === "none" && "list-none p-0 m-0",
              className
            ),
            ...props,
          },
          children
        )}
      </ListContext.Provider>
    );
  })
);

List.displayName = "List";

export interface ListItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  /** Custom leading icon replacing bullet marker */
  icon?: React.ReactNode;
  /** Custom marker override for this item */
  marker?: React.ReactNode;
}

/**
 * Semantic ListItem child component rendering gothic bullets or custom leading icons.
 */
export const ListItem = React.memo(
  React.forwardRef<HTMLLIElement, ListItemProps>(function ListItem(
    { icon, marker, children, className, ...props },
    ref
  ) {
    const context = React.useContext(ListContext);

    const renderMarker = (): React.ReactNode => {
      if (icon) {
        return (
          <span
            data-slot="list-item-icon"
            aria-hidden="true"
            className="shrink-0 flex items-center justify-center mt-0.5"
          >
            {icon}
          </span>
        );
      }

      if (marker !== undefined) {
        return (
          <span
            data-slot="list-item-marker"
            aria-hidden="true"
            className={cn("shrink-0 select-none", context.markerColor ?? "text-amber-400")}
          >
            {marker}
          </span>
        );
      }

      switch (context.variant) {
        case "diamond":
          return (
            <span
              data-slot="list-item-marker"
              aria-hidden="true"
              className={cn("shrink-0 text-[10px] select-none mt-0.5", context.markerColor ?? "text-amber-400")}
            >
              ◆
            </span>
          );
        case "dash":
          return (
            <span
              data-slot="list-item-marker"
              aria-hidden="true"
              className={cn("shrink-0 select-none", context.markerColor ?? "text-amber-300/80")}
            >
              —
            </span>
          );
        case "disc":
          return (
            <span
              data-slot="list-item-marker"
              aria-hidden="true"
              className={cn("shrink-0 text-xs select-none", context.markerColor ?? "text-amber-400")}
            >
              •
            </span>
          );
        case "decimal":
        case "none":
        default:
          return null;
      }
    };

    const markerElement = renderMarker();

    return (
      <li
        ref={ref}
        data-slot="list-item"
        className={cn(
          "min-w-0 text-sm leading-relaxed",
          markerElement ? "flex items-start gap-2" : "block",
          className
        )}
        {...props}
      >
        {markerElement}
        <span className="min-w-0 flex-1">{children}</span>
      </li>
    );
  })
);

ListItem.displayName = "ListItem";

export default List;
