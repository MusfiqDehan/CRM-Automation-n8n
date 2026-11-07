export * from "./TableSearchBar";
export * from "./TableFilterBar";
export * from "./TablePagination";
export * from "./TableEmptyState";
export * from "./ClientDataTable";

// Convenient type aliases
import type { ClientTableColumn } from "./ClientDataTable";
import type { TableFilterConfig, TableSortOption } from "./TableFilterBar";

export type TableColumn<T> = ClientTableColumn<T>;
export type FilterConfig = TableFilterConfig;
export type SortOption = TableSortOption;
