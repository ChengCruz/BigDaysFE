// Tour definitions for the in-app help walkthroughs.
// Targets reference DOM via stable `data-tour="<page>-<element>"` attributes —
// never use CSS classes here (refactor-safe; greppable).
import type { Step } from "react-joyride";

export type TourIconKey =
  | "home"
  | "calendar"
  | "rsvps"
  | "questions"
  | "guests"
  | "tables"
  | "floorplan"
  | "wallet"
  | "checkin"
  | "users"
  | "crew"
  | "rsvp-designer"
  | "checklist";

export interface TourDefinition {
  routePath: string;
  /** Optional regex to match additional pathnames that should trigger this tour. */
  pathPattern?: RegExp;
  title: string;
  description: string;
  icon: TourIconKey;
  steps: Step[];
  /** When true, the Tutorial page opens this tour in a new browser tab. */
  openInNewTab?: boolean;
}

const commonStepProps: Partial<Step> = {};

export const TOURS: TourDefinition[] = [
  {
    routePath: "/app/dashboard",
    title: "Dashboard",
    description:
      "Your event command centre — countdown, key stats, quick actions and recent activity all in one place.",
    icon: "home",
    steps: [
      {
        ...commonStepProps,
        target: '[data-tour="event-switcher"]',
        title: "Change your active event",
        content:
          "Plan more than one big day? Use this dropdown to switch between events — everything on screen updates to the one you pick.",
        placement: "bottom",
      },
      {
        ...commonStepProps,
        target: '[data-tour="dashboard-spotlight"]',
        title: "Active event",
        content:
          "The currently selected event with a live countdown to the big day. Use the event switcher above to view a different one.",
      },
      {
        ...commonStepProps,
        target: '[data-tour="dashboard-stats"]',
        title: "Key stats at a glance",
        content:
          "RSVP responses, budget usage and seating progress. Use the link at the bottom of each card to jump into that area.",
      },
      {
        ...commonStepProps,
        target: '[data-tour="dashboard-quick-actions"]',
        title: "Quick actions",
        content:
          "Shortcuts to the things you do most — add an RSVP, send invites, arrange seats or check in guests.",
      },
      {
        ...commonStepProps,
        target: '[data-tour="dashboard-recent-activity"]',
        title: "Recent activity",
        content:
          "Live feed of what's happening with your event — new RSVPs, gifts received, check-ins and more. Keep tabs on momentum at a glance.",
      },
      {
        ...commonStepProps,
        target: '[data-tour="help-bubble"]',
        title: "Need help again later?",
        content:
          "Click this bubble anytime to take a tour of the page you're on, or browse all tutorials.",
        placement: "left",
      },
    ],
  },
  {
    routePath: "/app/events",
    title: "Events",
    description:
      "Create, edit and archive your events. The 'active' event drives everything else — RSVPs, guests, tables and wallet.",
    icon: "calendar",
    steps: [
      {
        ...commonStepProps,
        target: '[data-tour="events-stats"]',
        title: "Event stats",
        content:
          "Quick view of how many events are active, archived and which one is coming up next.",
      },
      {
        ...commonStepProps,
        target: '[data-tour="events-search"]',
        title: "Find an event fast",
        content:
          "Search by name or location, and sort by upcoming, recent or alphabetical.",
      },
      {
        ...commonStepProps,
        target: '[data-tour="events-list"]',
        title: "Pick your active event",
        content:
          'Click "Select →" on any event card to make it active. The whole app then reflects that event.',
      },
    ],
  },
  {
    routePath: "/app/rsvps",
    title: "RSVPs",
    description:
      "Track guest responses, design your RSVP card and import or export your guest list.",
    icon: "rsvps",
    steps: [
      {
        ...commonStepProps,
        target: '[data-tour="rsvps-actions"]',
        title: "Add, import or export",
        content:
          "Add an RSVP manually, import a CSV/XLSX of guests, or export everything to a spreadsheet.",
      },
      {
        ...commonStepProps,
        target: '[data-tour="rsvps-stats"]',
        title: "Totals",
        content:
          "Total RSVPs received and total pax (number of people) coming.",
      },
      {
        ...commonStepProps,
        target: '[data-tour="rsvps-search"]',
        title: "Search guests",
        content:
          "Find a specific guest by typing their name.",
      },
    ],
  },
  {
    routePath: "/app/rsvps/designer-v3",
    pathPattern: /^\/app\/rsvps\/designer-v3\/?$/,
    openInNewTab: true,
    title: "RSVP Designer",
    description:
      "Build and style your RSVP page visually — drag blocks, customise colours and fonts, then publish a shareable link for guests.",
    icon: "rsvp-designer",
    steps: [
      {
        ...commonStepProps,
        target: '[data-tour="designer-toolbar"]',
        title: "Toolbar",
        content:
          "Undo/redo changes, switch between mobile, tablet and desktop previews, zoom in/out, check save status, and hit Preview to see the live form.",
        placement: "bottom",
      },
      {
        ...commonStepProps,
        target: '[data-tour="designer-left-panel"]',
        title: "Block library",
        content:
          "Pick a block from the left panel and click it to add it to your design — headings, event details, the RSVP form, images, countdowns and more. Switch to the Layers tab to reorder blocks by dragging.",
        placement: "right",
      },
      {
        ...commonStepProps,
        target: '[data-tour="designer-canvas"]',
        title: "Live canvas",
        content:
          "This is your RSVP page as guests will see it. Click any block to select it, then edit its settings in the right panel. Reorder blocks with the arrows that appear on hover.",
        placement: "left",
      },
      {
        ...commonStepProps,
        target: '[data-tour="designer-right-panel"]',
        title: "Block & page settings",
        content:
          'The "Block" tab shows settings for the selected block (text, colours, layout). The "Page" tab controls global settings — background, font, accent colour and the preview backdrop.',
        placement: "left",
      },
      {
        ...commonStepProps,
        target: '[data-tour="designer-save"]',
        title: "Save & publish",
        content:
          '"Save draft" preserves your work and updates the slug link (/rsvp/:slug). "Save & Publish" also updates the share-token link — use this when you\'re ready to send invites.',
        placement: "bottom",
      },
    ],
  },
  {
    routePath: "/app/form-fields",
    pathPattern: /^\/app\/(form-fields|events\/[^/]+\/form-fields)\/?$/,
    title: "RSVP Questions",
    description:
      "Customise the questions on your RSVP form — start from a template or write your own.",
    icon: "questions",
    steps: [
      {
        ...commonStepProps,
        target: '[data-tour="formfields-actions"]',
        title: "Add questions",
        content:
          'Tap "Add from Template" for ready-made questions (dietary, session, etc.) or "+ New Field" to write your own.',
      },
      {
        ...commonStepProps,
        target: '[data-tour="formfields-list"]',
        title: "Manage each question",
        content:
          "Edit a question, deactivate it to hide it from the form (existing answers are kept), or delete it permanently.",
      },
    ],
  },
  {
    routePath: "/app/guests",
    title: "Guests",
    description:
      "Your guest list — assign tables, generate QR codes and send WhatsApp invites.",
    icon: "guests",
    steps: [
      {
        ...commonStepProps,
        target: '[data-tour="guests-generate-qr"]',
        title: "Generate QR codes",
        content:
          "Generate a unique QR code for every guest at once. Guests use it to self check-in on the day.",
      },
      {
        ...commonStepProps,
        target: '[data-tour="guests-stats"]',
        title: "Assignment overview",
        content:
          "See at a glance how many guests are seated and how many still need a table.",
      },
      {
        ...commonStepProps,
        target: '[data-tour="guests-filters"]',
        title: "Filter and search",
        content:
          "Filter by guest type, assignment status, or search by name.",
      },
    ],
  },
  {
    routePath: "/app/tables/v3",
    title: "Tables",
    description:
      "Arrange seating in a clean grid view. Auto-assign guests, bulk-manage tables, and export your seating plan.",
    icon: "tables",
    steps: [
      {
        ...commonStepProps,
        target: '[data-tour="tables-actions"]',
        title: "Create and auto-assign",
        content:
          'Create tables one-at-a-time or in bulk, use "Auto-Assign" to fill seats automatically, or bulk-delete tables you no longer need.',
      },
      {
        ...commonStepProps,
        target: '[data-tour="tables-unassigned"]',
        title: "Unassigned guests",
        content:
          "Click here to see all guests who don't have a table yet. Open any table card to assign them.",
      },
      {
        ...commonStepProps,
        target: '[data-tour="tables-grid"]',
        title: "Tables grid",
        content:
          "Each card shows a table's pax filled vs capacity. Click a card to view seated guests, assign more, or edit the table.",
      },
      {
        ...commonStepProps,
        target: '[data-tour="tables-fullscreen"]',
        title: "Got 100+ guests?",
        content:
          "Open fullscreen mode for a roomier layout — guest list, table grid and detail panel side-by-side. Much easier for big weddings.",
      },
    ],
  },
  {
    routePath: "/app/tables/floorplan",
    pathPattern: /^\/app\/tables\/floorplan\/?$/,
    title: "Floor Plan",
    description:
      "Design your venue layout visually — drag tables, drop stages or dance floors, and assign guests right on the floor.",
    icon: "floorplan",
    steps: [
      {
        ...commonStepProps,
        target: '[data-tour="floorplan-toolbar"]',
        title: "Toolbox",
        content:
          "Pick a table shape (round, long or square) to place on the canvas. Add venue features like a stage, dance floor, walls, pillars, walkways or decorations. Use ✨ to auto-arrange all tables, or Standardize to unify shape and size in one go.",
      },
      {
        ...commonStepProps,
        target: ".floor-canvas",
        title: "The canvas",
        content:
          "Drag tables and decorations to position them. Click a table to select it — then assign guests, resize, change shape or delete. Drag guests from the panel on the right to seat them.",
        placement: "top",
      },
      {
        ...commonStepProps,
        target: '[data-tour="floorplan-guest-panel"]',
        title: "Guest list",
        content:
          "Unassigned guests are listed at the top — drag one onto a table to seat them. Assigned guests are grouped below; collapse that section to keep things tidy.",
        placement: "left",
      },
      {
        ...commonStepProps,
        target: '[data-tour="floorplan-actions"]',
        title: "Don't forget to save",
        content:
          'Layout changes are not auto-saved. Hit "Save Layout" before leaving the page or your arrangement will be lost.',
      },
    ],
  },
  {
    routePath: "/app/wallet",
    title: "Wallet",
    description:
      "Track your event budget and expenses. Add transactions, categorise them and export reports.",
    icon: "wallet",
    steps: [
      {
        ...commonStepProps,
        target: '[data-tour="wallet-actions"]',
        title: "Setup, add and export",
        content:
          "Set up your wallet once, then add transactions as you spend. Export reports anytime.",
      },
      {
        ...commonStepProps,
        target: '[data-tour="wallet-summary"]',
        title: "Budget summary",
        content:
          "See your total budget, total spent, remaining balance and budget health all in one row.",
      },
      {
        ...commonStepProps,
        target: '[data-tour="wallet-transactions"]',
        title: "Transactions",
        content:
          "Every spend is listed here. Click any row to edit, or use the filters above to drill in by category, type or status.",
        placement: "bottom",
      },
    ],
  },
  {
    routePath: "/app/checkin",
    title: "Check-in",
    description:
      "Scan guest QR codes or manually check guests in on the event day.",
    icon: "checkin",
    steps: [
      {
        ...commonStepProps,
        target: '[data-tour="checkin-stats"]',
        title: "Live count",
        content:
          "See how many guests have arrived vs. how many are still on the way, updated in real time.",
      },
      {
        ...commonStepProps,
        target: '[data-tour="checkin-scanner"]',
        title: "QR scanner",
        content:
          'Tap "Start Camera" and point it at a guest\'s QR code. They check in with one beep.',
      },
      {
        ...commonStepProps,
        target: '[data-tour="checkin-manual"]',
        title: "Manual check-in",
        content:
          "If a guest can't show their QR, search by name or phone and tap to check them in.",
      },
    ],
  },
  {
    routePath: "/app/users",
    title: "Users & Profile",
    description:
      "View your profile, change your password and — if you're an admin — manage all user accounts.",
    icon: "users",
    steps: [
      {
        ...commonStepProps,
        target: '[data-tour="users-stats"]',
        title: "Account overview",
        content:
          "A quick count of all users broken down by role — total, admins, members and staff. Only visible to admins.",
      },
      {
        ...commonStepProps,
        target: '[data-tour="users-actions"]',
        title: "Switch between views",
        content:
          'Admins can click "View All Users" to manage every account, or "New User" to invite someone. Everyone else just sees their own profile here.',
      },
      {
        ...commonStepProps,
        target: '[data-tour="users-profile"]',
        title: "Your profile",
        content:
          "Your name, email, role and account dates at a glance. This is the info other team members see.",
      },
      {
        ...commonStepProps,
        target: '[data-tour="users-password"]',
        title: "Change your password",
        content:
          "Update your password anytime — enter your current one, then your new one twice to confirm.",
      },
    ],
  },
  {
    routePath: "/app/crew",
    title: "Crew",
    description:
      "Add event-day staff who can sign in to help with check-in, guests and tables.",
    icon: "crew",
    steps: [
      {
        ...commonStepProps,
        target: '[data-tour="crew-add"]',
        title: "Add crew members",
        content:
          "Add a name and we'll generate a Crew ID and PIN they use to sign in on event day.",
      },
      {
        ...commonStepProps,
        target: '[data-tour="crew-event-code"]',
        title: "Event Code",
        content:
          "Share this code with your crew along with their Crew ID and PIN. They sign in via the Staff tab on the login page.",
      },
      {
        ...commonStepProps,
        target: '[data-tour="crew-list"]',
        title: "Manage crew",
        content:
          "Everyone you've added shows up here. Edit names or remove crew members anytime.",
      },
    ],
  },
  {
    routePath: "/app/checklist",
    title: "Checklist",
    description:
      "Track every wedding to-do from venue booking to final fittings — add items, set due dates and tick them off as you go.",
    icon: "checklist",
    steps: [
      {
        ...commonStepProps,
        target: '[data-tour="checklist-actions"]',
        title: "Add to-dos",
        content:
          'Hit "+ Add Item" to create a to-do manually. Or use "Load Starter Checklist" on the empty state to pre-fill a curated set of wedding tasks in one go.',
        placement: "bottom",
      },
      {
        ...commonStepProps,
        target: '[data-tour="checklist-stats"]',
        title: "Progress at a glance",
        content:
          "See how many items are total, done and still remaining. The progress bar beneath shows your overall completion percentage.",
      },
      {
        ...commonStepProps,
        target: '[data-tour="checklist-filters"]',
        title: "Filter by category",
        content:
          "Tap a category pill to focus on just that area — Venue, Catering, Attire, Photography and more. Only categories that have items show up here.",
      },
      {
        ...commonStepProps,
        target: '[data-tour="checklist-list"]',
        title: "Tick items off",
        content:
          "Click the circle on any item to mark it done (or undo it). Use the pencil to edit details like due dates and notes, or the trash to remove it.",
      },
    ],
  },
];

export function findTourForPath(pathname: string): TourDefinition | null {
  // Specific pathPattern matches take priority over prefix matches, so a sub-route
  // like /app/events/:id/form-fields resolves to the RSVP Questions tour rather
  // than getting captured by the broader /app/events prefix.
  const byPattern = TOURS.find((t) => t.pathPattern?.test(pathname));
  if (byPattern) return byPattern;
  return TOURS.find((t) => pathname.startsWith(t.routePath)) ?? null;
}

export function getTourByRoute(routePath: string): TourDefinition | null {
  return TOURS.find((t) => t.routePath === routePath) ?? null;
}
