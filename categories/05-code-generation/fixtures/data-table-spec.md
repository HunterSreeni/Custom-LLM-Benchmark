# Data Table Component Specification

## Overview
Build a reusable, filterable, sortable data table component using Vue 3 Composition API, TypeScript, and Tailwind CSS.

## Requirements

### Component Props
- `columns`: Array of column definitions, each with `key` (string), `label` (string), `sortable` (boolean, default true), and optional `formatter` function.
- `data`: Array of row objects (generic type `T`).
- `pageSize`: Number of rows per page (default 10).
- `searchable`: Boolean to enable/disable the search bar (default true).
- `emptyMessage`: String shown when no data matches (default "No results found").

### Sorting
- Clicking a column header sorts by that column ascending. Clicking again toggles to descending. A third click removes the sort.
- Display a visual indicator (arrow icon) showing current sort direction.
- Only columns marked `sortable: true` should be clickable.

### Filtering
- A text input at the top searches across all visible columns.
- Filtering is case-insensitive and debounced (300ms delay).
- Show a "Clear" button when the filter is active.

### Pagination
- Show page controls below the table: Previous, page numbers, Next.
- Disable Previous on page 1 and Next on the last page.
- Display "Showing X-Y of Z results" text.
- Resetting the filter should return to page 1.

### Styling (Tailwind CSS)
- Striped rows with alternating `bg-white` and `bg-gray-50`.
- Hover state: `bg-blue-50` on row hover.
- Sticky header row.
- Responsive: horizontal scroll on small screens with `overflow-x-auto`.
- Rounded corners and subtle border on the table container.

### Accessibility
- Use semantic `<table>`, `<thead>`, `<tbody>`, `<th>`, `<td>` elements.
- Sortable column headers should have `aria-sort` attribute.
- Search input should have a visible label or `aria-label`.

### TypeScript
- The component should be generic - accept `T extends Record<string, unknown>`.
- All props, emits, and internal state should be properly typed.
- Export the column definition interface for consumers.

## Deliverables
- `DataTable.vue` - the main component
- `types.ts` - shared type definitions
- `useTableSort.ts` - composable for sorting logic
- `useTableFilter.ts` - composable for filtering logic
- `useTablePagination.ts` - composable for pagination logic
