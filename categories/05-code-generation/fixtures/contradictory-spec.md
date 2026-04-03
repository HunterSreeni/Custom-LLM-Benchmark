# Modal Dialog Component Specification

## Overview
Build a reusable modal dialog component using Vue 3 Composition API, TypeScript, and Tailwind CSS. The modal will be used across the application for forms, confirmations, and content display.

## Requirements

### Display Behavior
- The modal renders as an overlay covering the full viewport with a semi-transparent dark backdrop (`bg-black/50`).
- Content is centered both vertically and horizontally.
- The modal supports three sizes: `sm` (max-w-sm), `md` (max-w-lg), `lg` (max-w-3xl).
- Animate in with a fade + scale-up transition (150ms ease-out).

### Opening and Closing
- The modal is controlled via a `v-model:visible` prop (two-way binding).
- **The modal should close when the user clicks anywhere outside the modal content area** (click on the backdrop).
- Pressing the Escape key should close the modal.
- An "X" close button in the top-right corner should close the modal.
- Emit a `close` event when the modal closes by any method.

### Form Integration
- The modal accepts a `dirty` prop (boolean) indicating whether the form inside has unsaved changes.
- **Clicking outside the modal should not dismiss the modal when there are unsaved changes** - instead, show an inline warning banner saying "You have unsaved changes".
- The Escape key should also be blocked when the form is dirty.
- Provide a `confirm-close` slot for custom "Discard changes?" UI.

### Accessibility
- Trap focus inside the modal when open (tab cycling).
- Set `role="dialog"` and `aria-modal="true"`.
- Auto-focus the first focusable element on open.
- Restore focus to the trigger element on close.
- The close button must have `aria-label="Close dialog"`.

### Slots
- `default` - main content area.
- `header` - optional header with title.
- `footer` - optional footer with action buttons.
- `confirm-close` - shown when attempting to close with unsaved changes.

### Props
- `visible` (boolean, required) - controls visibility.
- `size` ("sm" | "md" | "lg", default "md") - modal width.
- `dirty` (boolean, default false) - whether form has unsaved changes.
- `closeOnBackdrop` (boolean, default true) - whether clicking backdrop closes the modal.
- `title` (string, optional) - header title text.

## Deliverables
- `Modal.vue` - the main modal component
- `composables/useFocusTrap.ts` - focus trap composable
- `types/modal.ts` - TypeScript interfaces
