# Floor Plan Feature — Implementation Log

## Table of Contents
1. [Plan](#1-plan)
2. [What Was Done](#2-what-was-done)
3. [What Can Be Optimized](#3-what-can-be-optimized)

---

## 1. Plan

### Objective
Build a visual floor plan editor at `/app/tables/floorplan` where wedding planners can:
- Drag and arrange tables on a canvas
- Place decorative elements (stage, dance floor, pillars, walls)
- Assign/unassign guests to table seats
- View seating stats at a glance

### Key Constraint
The backend has **no endpoint** for saving table x/y positions. The `DragDropSeatingRequest` only saves `{ guestId, tableId, seatIndex }`. All spatial data (table positions, decorative items) is persisted in **localStorage** keyed by `floorplan-{eventId}`.

### Architecture
```
FloorPlanPage.tsx (orchestrator)
  ├── Header (title + stat pills + actions)
  ├── Toolbar (shapes, decorations, context bar, zoom, snap)
  ├── FloorCanvas.tsx (pan/zoom container)
  │     ├── FloorTableItem.tsx (per-table: drag, resize, seats, guest drop)
  │     └── FloorObstacleItem.tsx (per-decoration: drag, resize)
  ├── FloorGuestPanel.tsx (desktop sidebar / mobile drawer)
  └── useFloorPlanState.ts (state hook + localStorage persistence)
```

### Implementation Order
1. `useFloorPlanState` — State management hook with localStorage
2. `FloorObstacleItem` — Simple draggable decoration
3. `FloorTableItem` — Draggable table with math-calculated seat positions
4. `FloorCanvas` — Canvas container with pan/zoom/minimap
5. `FloorGuestPanel` — Guest sidebar with search and drag support
6. `FloorPlanPage` — Main page wiring all components + toolbar
7. Route + Sidebar — Navigation integration

### Design Decisions
| Decision | Rationale |
|----------|-----------|
| No `react-rnd` library | Plain mousedown/mousemove/mouseup is lighter, matches mockup pattern |
| Seat positions via math | Round: circle distribution, Rect: top/bottom+sides, Square: all 4 edges |
| localStorage for positions | No backend endpoint; sufficient for per-user layout |
| Native wheel listener | React `onWheel` is passive; `addEventListener({passive:false})` needed for `preventDefault()` |
| Capacity stored in `meta` | Enables `changeTableShape()` to recalculate dimensions without API lookup |

---

## 2. What Was Done

### Phase 1 — Initial Build (6 files created, 2 files modified)

**Files Created:**
| File | Lines | Purpose |
|------|-------|---------|
| `useFloorPlanState.ts` | ~180 | Custom hook: `floorItems` state, localStorage load/save, `addItem`, `updateItem`, `removeItem`, `autoArrange`, `syncTables`, `changeTableShape` |
| `FloorObstacleItem.tsx` | ~155 | Draggable stage/dance floor/pillar/wall with gradient backgrounds, resize handle |
| `FloorTableItem.tsx` | ~335 | Draggable table with math-positioned seats, drag-drop guest zones, seat click handlers, resize handle |
| `FloorCanvas.tsx` | ~280 | Canvas with CSS transform pan/zoom, native wheel zoom, draggable minimap, hint box |
| `FloorGuestPanel.tsx` | ~140 | Right sidebar: unassigned guests (draggable), assigned summary, search filter |
| `FloorPlanPage.tsx` | ~610 | Main page: stat pills, toolbar, context bar, canvas, guest panel, table modal, toast, seat popover, mobile drawer |

**Files Modified:**
| File | Change |
|------|--------|
| `src/routers/routes.tsx` | Added `<Route path="floorplan" element={<FloorPlanPage />} />` inside tables group |
| `src/components/organisms/Sidebar.tsx` | Added "Floor Plan" nav link with `ViewGridIcon` |
| `src/index.css` | Added `animate-fade-in`, `animate-slide-up` and `animate-slide-left` keyframe animations |

### Phase 2 — Bug Fixes (Round 1)

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Tables all same size (110x110) | Fixed dimensions regardless of capacity | Created `tableDimensions(capacity, shape)` helper that scales per shape |
| Seats overlapping table body | Hardcoded offsets (-14, -18) | Introduced `SEAT_SIZE=26`, `SEAT_GAP=6` constants; seats pushed outside table edge |
| Auto-arrange too tight | Fixed 200x180 spacing | Dynamic spacing based on `maxW + 80` and `maxH + 80` |
| `syncTables` wrong signature | Accepted `string[]` (just IDs) | Changed to `{id, capacity}[]` so tables get proper sizing |
| Snap button cut off | Toolbar overflow | Changed to `flex flex-wrap items-center` |
| Guest panel not filling height | Wrapper missing height | Changed to `hidden lg:flex h-full` |
| Wheel zoom console warning | React onWheel is passive | Switched to native `addEventListener` with `{passive: false}` |
| Minimap inaccurate | Canvas size mismatch | Increased virtual canvas to 2000x1400 |

### Phase 3 — Feature Fixes (Round 2)

**Issue 1: Table shapes always circles**
- **Problem:** `syncTables()` hardcoded `meta: { shape: "round" }` for all tables. No mechanism to change shape.
- **Solution:**
  - Added `changeTableShape(id, shape)` to `useFloorPlanState` hook
  - Updated `syncTables` to store `capacity` in meta: `{ shape: "round", capacity: t.capacity }`
  - Created `handleShapeTool()` in FloorPlanPage: if a table is selected, changes its shape immediately; otherwise enters placement mode
  - Toolbar shape buttons (Round/Long/Square) now call `handleShapeTool()` instead of directly setting `toolMode`

**Issue 2: Not responsive at lower viewports**
- **Problem:** Guest panel (`FloorGuestPanel`) used `hidden lg:flex` — disappeared on `<1024px` with no alternative.
- **Solution:**
  - Added `showGuestPanel` boolean state
  - Desktop: unchanged `hidden lg:flex` sidebar
  - Mobile (`<lg`): floating "Guests" FAB button in bottom-left with unassigned count badge
  - Clicking FAB opens full-height slide-over drawer from right with backdrop overlay and close button
  - Toolbar text labels use `hidden sm:inline` — only icons show on `<640px`
  - Action button labels ("Print Layout", "Auto-Arrange") also use `hidden sm:inline`
  - Added `animate-slide-left` CSS animation for drawer entrance

**Issue 3: Cannot click seats to assign/unassign**
- **Problem:** Seat dots in `FloorTableItem` had no click handlers. Only drag-and-drop from guest panel worked.
- **Solution:**
  - Added `onSeatClick` prop through `FloorCanvas` → `FloorTableItem`
  - Each seat div now has `onClick` that calls `onSeatClick(tableId, seatIndex, guestId, anchorX, anchorY)`
  - **Occupied seat click:** Immediately calls `useUnassignGuestFromTable` mutation → toast "Guest unassigned"
  - **Empty seat click:** Opens a `seatPopover` positioned at the seat's screen coordinates, listing all unassigned guests
  - Selecting a guest from the popover calls `useAssignGuestToTable` → toast "Guest assigned!"
  - Popover closes on backdrop click or after assignment
  - Imported `useUnassignGuestFromTable` from `useGuestsApi.ts` (already existed but was unused)

### Phase 4 — UX Redesign + Delete Fix (Round 3)

**Issue 1: Keyboard Delete not working for obstacles**
- **Root cause:** When clicking an obstacle/table, `e.stopPropagation()` prevents the event from reaching the canvas `<div>`. Since the canvas never receives the click, it never gets focus, so `onKeyDown` (Delete/Backspace) never fires.
- **Fix:** Added `useEffect` in `FloorCanvas` that calls `containerRef.current.focus()` whenever `selectedId` changes to non-null.

**Issue 2: UX/Design overhaul**
- **FloorPlanPage:** Replaced `StatsCard` grid with inline stat pills in the header. Streamlined toolbar into one compact row. Added a **selection context bar** that appears when an item is selected — shows item name, shape switcher (for tables), and visible Delete button.
- **FloorCanvas:** Auto-dismiss hint after 8s. Cleaner glassmorphism hint box and minimap.
- **FloorTableItem/FloorObstacleItem:** Better selection outlines (indigo, consistent). Subtle drop shadows.
- **FloorGuestPanel:** Compact header with icon, search input with magnifying glass prefix.
- Removed `StatsCard` dependency. Replaced emoji close/FAB buttons with proper SVG icons.

### Phase 5 — Shape, Resize, Delete, Minimap (Round 4)

**Issue 1: New table insertion always defaults to circle**
- **Root cause:** `syncTables()` hardcoded `"round"` for all newly added tables. The `pendingShape.current` ref was set when the table modal closed but never consumed by `syncTables`.
- **Fix:** Added `defaultShape` parameter to `syncTables(apiTables, defaultShape)`. The sync effect now passes `pendingShape.current || "round"` and clears the ref after use. Moved ref declarations before the sync effect.

**Issue 2: Table deletion**
- **Problem:** Tables were blocked from deletion with "Cannot delete table from floor plan" toast.
- **Fix:** Imported `useDeleteTable` from `useTablesApi`. `handleDeleteSelected` now calls `deleteTable.mutate(selectedId)` for table items — hits the `DELETE` API endpoint, then on success removes the floor item. The Delete button in the context bar now appears for **all** selected items (tables + obstacles). Shows "Deleting..." with disabled state during API call; error toast on failure.

**Issue 3: Shapes are now resizable**
- **Problem:** The resize handle (bottom-right corner) on tables was visual-only — no drag logic.
- **Fix:** Added `onResize: (id: string, w: number, h: number) => void` prop to both `FloorTableItem` and `FloorObstacleItem`. The resize handle now has `onMouseDown` that tracks cursor delta, calculates new dimensions (with min size enforcement: tables 50px, obstacles 20-30px), and calls `onResize`. Handle visually changed from circle to rounded square. Seat positions auto-recalculate since `seatPositions()` uses the item's current width/height. Prop chain: `FloorPlanPage (handleResizeItem → updateItem)` → `FloorCanvas (onResizeItem)` → items `(onResize)`.

**Issue 4: Minimap click/drag to navigate**
- **Problem:** The viewport indicator had `pointerEvents: "none"` and the minimap was non-interactive.
- **Fix:** Added `handleMinimapMouseDown` to the minimap container div. Click or drag anywhere on the minimap to pan the canvas — converts minimap pixel coordinates to canvas coordinates via `mmScale`, then calculates panX/panY to center the viewport on that point. All item dots have `pointerEvents: "none"` so clicks pass through. Header shows "drag to navigate" hint. Supports continuous drag (mousemove listener on window).

### API Hooks Used
| Hook | Usage |
|------|-------|
| `useTablesApi(eventId)` | Fetch all tables for the event |
| `useGuestsApi(eventId)` | Fetch all guests for the event |
| `useAssignGuestToTable(eventId)` | Assign guest to table (drag-drop + seat click) |
| `useUnassignGuestFromTable(eventId)` | Unassign guest from table (seat click) |
| `useDeleteTable(eventId)` | Delete table via API (floor plan delete action) |

---

## 3. What Can Be Optimized

### High Priority

**1. Backend endpoint for floor plan persistence**
- Currently: localStorage only — data is lost if browser storage is cleared, and not shared between devices/users.
- Ideal: `POST /api/v1/FloorPlan/{eventId}` that saves the full `floorItems` JSON.
- This is the biggest limitation of the feature.

**2. Undo/Redo**
- No undo stack exists. Moving a table to the wrong spot requires manual repositioning.
- Could implement with a simple state history array (`past[]`, `present`, `future[]`).

### Medium Priority

**3. Seat index tracking in assignment**
- The API supports `seatIndex` in `DragDropSeatingRequest`, but we don't send it.
- The seat popover knows which seat was clicked (`seatIndex`). Pass it to the assign mutation for exact seat tracking.

**4. Touch support for mobile**
- Drag uses `mousedown/mousemove/mouseup` — doesn't work on touch devices.
- Need: `touchstart/touchmove/touchend` equivalents, or use pointer events (`pointerdown` etc.).
- Pan/zoom on touch would need pinch gesture handling.

**5. Context menu on tables**
- Right-click table → menu with: Change Shape, Edit Details, View Guests, Delete Table.
- Currently shape change requires selecting table first, then using context bar. Context menu is more discoverable.

**6. Guest drag from panel to specific seat**
- Currently dragging a guest onto a table assigns them to the table generally (no seat index).
- Could detect which seat the drop lands on and assign to that specific seat.

**7. Performance: virtualized rendering**
- All floor items render at all times regardless of canvas viewport.
- For events with 50+ tables, consider only rendering items visible within the current pan/zoom viewport.
- Could use `IntersectionObserver` or manual bounding box checks.

**8. Constrained resize (aspect ratio lock)**
- Current resize is free-form. For round tables, hold Shift to maintain aspect ratio (keep it circular).
- For pillars (circular), resize should lock to square dimensions by default.

### Low Priority

**9. Export/Import floor plan**
- Export as JSON file for backup or sharing between events.
- Export as PNG/PDF for printing (currently uses `window.print()` which prints the entire page).

**10. Rotation support**
- The `FloorItem` interface has an optional `rotation` field but it's never used.
- Could add rotation handles or a rotation control for decorative items (stage at an angle, etc.).

**11. Table grouping / zones**
- Allow users to define zones (e.g., "VIP area", "Family section") with colored background regions.
- Tables within a zone could be auto-colored or labeled.

**12. Collaboration / real-time sync**
- Multiple planners editing the same floor plan simultaneously.
- Would require WebSocket backend + conflict resolution. Far future scope.

**13. FloorPlanPage component size**
- `FloorPlanPage.tsx` is growing large (610+ lines). Consider extracting:
  - Toolbar into `FloorToolbar.tsx`
  - Context bar into `SelectionContextBar.tsx`
  - Seat popover into `SeatAssignPopover.tsx`
  - Mobile drawer into `MobileGuestDrawer.tsx`

**14. Snap-to-alignment guides**
- Currently snap only aligns to a fixed grid (40px).
- Smart guides that show alignment lines when tables are lined up horizontally/vertically would be more useful.

---

## Verification Checklist

- [x] Tables render with correct shapes (round, rect, square)
- [x] Shape change works: select table → click shape button in context bar → table reshapes
- [x] New table insertion respects selected shape tool (round/rect/square)
- [x] Drag tables to reposition (persists in localStorage)
- [x] Resize tables and obstacles via corner drag handle
- [x] Add decorations: stage, dance floor, pillar, wall
- [x] Delete tables via API (context bar Delete button or keyboard Delete)
- [x] Delete obstacles (context bar Delete button or keyboard Delete)
- [x] Zoom with scroll wheel (0.3x–2.0x)
- [x] Pan by dragging empty canvas
- [x] Minimap shows overview with viewport indicator
- [x] Minimap click/drag to navigate (pans canvas to clicked position)
- [x] Snap toggle works (40px grid)
- [x] Auto-arrange repositions all tables in grid
- [x] Double-click table opens edit modal
- [x] Drag guests from panel onto tables (API assignment)
- [x] Click empty seat → popover to pick guest → assigns via API
- [x] Click occupied seat → unassigns guest via API
- [x] Guest panel visible on desktop (sidebar)
- [x] Guest panel accessible on mobile (floating button → drawer)
- [x] Toolbar responsive: text labels hide on small screens
- [x] Selection context bar shows name, shape tools, delete button
- [x] Toast notifications for all user actions
- [x] TypeScript compiles with no errors
