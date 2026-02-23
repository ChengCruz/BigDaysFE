# Floor Plan Layout Feature

## Context
The mockup at `_claude/expectation/TableLayout-FloorPlan-Mockup.html` shows a visual floor plan editor where users can drag tables, place obstacles (pillars/walls), add stage/dance floor elements, and see an unassigned guest panel. The existing `TableLayoutPlanner.tsx` is a minimal per-table `react-rnd` component that doesn't match the mockup at all. We'll replace it with a full floor plan page.

**Key constraint:** The backend has no endpoint for saving table x/y positions on a floor plan canvas. The `DragDropSeatingRequest` only saves `{ guestId, tableId, seatIndex }` — no spatial coordinates. Table positions will be persisted in **localStorage** keyed by eventId.

## Scope

Create a new `FloorPlanPage.tsx` as a top-level route at `/app/tables/floorplan`. This is a **frontend-only visual layout tool** that:
- Shows all event tables from `useTablesApi(eventId)` as draggable elements on a canvas
- Shows unassigned guests from `useGuestsApi(eventId)` in a side panel
- Supports drag-and-drop guest assignment (calls existing `useAssignGuestToTable`)
- Persists table positions + decorative elements in localStorage
- Supports pan, zoom, snap-to-grid, auto-arrange

## Files to Create

### 1. `src/components/pages/Tables/FloorPlanPage.tsx` (~400 lines)
Main page component. Orchestrates canvas + guest panel. Reuses:
- `StatsCard` from `atoms/StatsCard.tsx` for stats bar
- `Button` from `atoms/Button.tsx` for action buttons
- `GuestCard` from `molecules/GuestCard.tsx` for guest panel
- `TableFormModal` from `molecules/TableFormModal.tsx` for new table modal
- `useTablesApi`, `useCreateTable` from `api/hooks/useTablesApi.ts`
- `useGuestsApi`, `useAssignGuestToTable` from `api/hooks/useGuestsApi.ts`
- `useEventContext` from `context/EventContext.tsx`

Layout structure:
```
Stats Cards (4-grid)
Title + Actions (Print, Auto-Arrange, + New Table, Save Layout)
Toolbar (table shapes, stage, dance floor, obstacles, zoom, snap)
Main Area: [Canvas (flex-1)] + [Guest Panel (w-80)]
```

State management:
- `floorItems` — array of `{ id, type, x, y, width, height, rotation?, meta? }` stored in localStorage
- `zoom`, `panX`, `panY` — canvas transform
- `selectedId` — currently selected element
- `snapEnabled` — grid snap toggle
- `searchTerm` — guest search filter

### 2. `src/components/pages/Tables/FloorCanvas.tsx` (~250 lines)
The canvas component with pan/zoom. Renders:
- Grid background via CSS
- All floor items (tables, stage, dance floor, obstacles)
- Seats around tables (positioned via math based on table shape)
- Minimap in bottom-right corner
- Hint box (dismissible)

Handles: mouse wheel zoom, mouse drag pan, click to deselect, keyboard Delete to remove.

### 3. `src/components/pages/Tables/FloorTableItem.tsx` (~120 lines)
Individual draggable table element. Shows:
- Colored shape (round/rect/square) based on table data
- Table name, assigned/capacity count
- Seat dots around the perimeter (occupied = green, empty = dashed)
- Selected state outline
- Double-click opens edit

Drag via native `mousedown/mousemove/mouseup` (same as mockup pattern — no library needed since we already have the pattern from the HTML mockup).

### 4. `src/components/pages/Tables/FloorObstacleItem.tsx` (~60 lines)
Draggable obstacle (pillar circle or wall rectangle). Visual-only decoration.

### 5. `src/components/pages/Tables/FloorGuestPanel.tsx` (~100 lines)
Right sidebar showing unassigned guests (search + list using `GuestCard`) and assigned guests summary. Reuses `GuestCard` molecule.

### 6. `src/components/pages/Tables/useFloorPlanState.ts` (~80 lines)
Custom hook managing floor plan state + localStorage persistence.
- Loads/saves `floorItems` keyed by `floorplan-{eventId}`
- Provides `addItem`, `updateItem`, `removeItem`, `autoArrange` actions
- Maps real tables (from API) into floor items on first load

## Files to Modify

### 7. `src/routers/routes.tsx`
Add route: `<Route path="floorplan" element={<FloorPlanPage />} />` inside the `tables` route group.

### 8. `src/components/organisms/Sidebar.tsx`
Add "Floor Plan" nav link after "Tables" in the `links` array:
```ts
{ to: "/app/tables/floorplan", label: "Floor Plan", Icon: ViewGridIcon, description: "Visual layout" },
```

## Implementation Order

1. **useFloorPlanState hook** — localStorage state management
2. **FloorObstacleItem** — simple draggable obstacle
3. **FloorTableItem** — draggable table with seats
4. **FloorCanvas** — canvas with pan/zoom rendering items
5. **FloorGuestPanel** — guest sidebar panel
6. **FloorPlanPage** — main page wiring everything together
7. **Route + Sidebar** — navigation integration

## Key Design Decisions

- **No `react-rnd` dependency** — The mockup uses plain mousedown/mousemove drag. This is simpler and matches the mockup exactly. We already have this pattern in the HTML.
- **localStorage for positions** — No backend endpoint exists for x/y coordinates. localStorage is sufficient for a per-user layout tool.
- **Seat positions calculated via math** — Round tables: seats placed in a circle. Rect tables: seats along long edges. Square tables: seats evenly along all 4 sides. No manual seat positioning needed.
- **Real data from existing hooks** — Tables come from `useTablesApi`, guests from `useGuestsApi`. Guest assignment uses `useAssignGuestToTable`. No new API hooks needed.
- **Decorative items (stage, dance floor, obstacles)** are purely visual and stored only in localStorage.

## Verification

1. Run `npm run dev` and navigate to `/app/tables/floorplan`
2. Verify tables from the API appear on the canvas
3. Drag tables to reposition — positions persist after page refresh
4. Add stage, dance floor, obstacles via toolbar
5. Zoom with scroll wheel, pan by dragging empty canvas
6. Drag guests from the panel onto tables (calls assign API)
7. Auto-arrange button repositions all tables in a grid
8. Delete key removes selected element
9. Snap toggle works (snaps to 40px grid)
10. Sidebar "Floor Plan" link is highlighted when active
