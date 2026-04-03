# Drag-and-Drop Kanban Board Specification

## Overview
Build a Kanban board component using Vue 3 with native HTML5 drag-and-drop, optimistic UI updates, server synchronization, and a full undo/redo history system.

## Requirements

### Board Structure
- Columns: "To Do", "In Progress", "Review", "Done" (configurable via props).
- Each column displays cards with: title, description (truncated to 2 lines), assignee avatar, priority badge (low/medium/high/urgent), and due date.
- Cards are ordered within each column. Moving a card changes both its column and its position index.

### Drag-and-Drop
- Use native HTML5 Drag and Drop API (no external libraries).
- Cards are draggable between columns and within the same column (reorder).
- Show a visual drop indicator (blue line) at the insertion point while dragging.
- Apply a semi-transparent ghost effect on the dragged card.
- Support touch devices using pointer events as a fallback.

### Optimistic Updates
- When a card is moved, update the UI immediately before the API call completes.
- Send a PATCH request to `/api/cards/:id/move` with `{ column: string, position: number }`.
- If the API call fails, revert the card to its previous position and show an error toast.
- Store the previous state snapshot before each optimistic update for rollback.

### Undo/Redo System
- Maintain a history stack of board states (max 50 entries).
- Keyboard shortcuts: Ctrl+Z for undo, Ctrl+Shift+Z for redo.
- Also provide visible Undo/Redo buttons in the toolbar.
- Each history entry stores: the action type, the card ID, the previous state, and the new state.
- Performing a new action after undoing clears the redo stack.
- Undo/redo should also trigger API calls to sync the server state.

### Keyboard Accessibility
- Tab through cards in reading order (left to right, top to bottom).
- Enter/Space to pick up a card, arrow keys to move it, Enter/Space to drop.
- Escape to cancel a drag operation.
- All interactive elements must have appropriate `role`, `aria-label`, and `aria-grabbed`/`aria-dropeffect` attributes.
- Announce card movements to screen readers via `aria-live` region.

### API Integration
- `GET /api/boards/:id` - fetch board with all columns and cards.
- `PATCH /api/cards/:id/move` - move a card.
- `POST /api/cards` - create a new card.
- `DELETE /api/cards/:id` - delete a card.
- All API calls use the Axios instance with auth headers.

## Deliverables
- `components/KanbanBoard.vue` - main board component
- `components/KanbanColumn.vue` - single column
- `components/KanbanCard.vue` - single card
- `composables/useDragDrop.ts` - drag and drop logic
- `composables/useHistory.ts` - undo/redo history stack
- `stores/board.ts` - Pinia board store with optimistic updates
- `types/kanban.ts` - TypeScript interfaces
