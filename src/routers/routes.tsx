// src/routers/AppRoutes.tsx
import { Routes, Route, Navigate, Outlet, useNavigate, useLocation } from "react-router";

import LandingPage from "../components/pages/Landing/LandingPage";
import LoginPage from "../components/pages/Auth/LoginPage";
import CrewLoginPage from "../components/pages/Auth/CrewLoginPage";
import RegisterPage from "../components/pages/Auth/RegisterPage";
import VerifyEmailPage from "../components/pages/Auth/VerifyEmailPage";
import ResetPasswordPage from "../components/pages/Auth/ResetPasswordPage";
import ContactPage from "../components/pages/Auth/ContactPage";
import FeaturesPage from "../components/pages/Public/Features/FeaturesPage";

import PublicTemplate from "../components/templates/PublicTemplate";
import { CoupleShell } from "../components/organisms/CoupleShell";
import { PlannerShell } from "../components/organisms/PlannerShell";
import { HelpBubble } from "../components/organisms/HelpBubble";
import { ExportBackupReminder } from "../components/organisms/ExportBackupReminder";
import { TourProvider } from "../components/tour/TourProvider";
import { NoEventsState } from "../components/molecules/NoEventsState";
import { useEventContext } from "../context/EventContext";
import { useUiMode } from "../context/UiModeContext";

const CREW_ALLOWED_PATHS = ["/app/checkin", "/app/guests", "/app/tables"];

function AppLayout() {
  const { mustChooseEvent } = useEventContext();
  const { userRole } = useAuth();
  const { mode } = useUiMode();
  const location = useLocation();

  if (userRole === 6 && !CREW_ALLOWED_PATHS.some(p => location.pathname.startsWith(p))) {
    return <Navigate to="/app/checkin" replace />;
  }

  // When the user has zero events, show an inline onboarding state on every
  // route except /app/events (where they can actually create one) and
  // /app/contact (support must stay reachable even before any event exists).
  const onEventsRoute = location.pathname.startsWith("/app/events");
  const onContactRoute = location.pathname.startsWith("/app/contact");
  const showEmptyState = mustChooseEvent && !onEventsRoute && !onContactRoute;

  // Both shells render the same content — only the chrome around it differs, so
  // no page component is duplicated. Role picks the default mode; the account
  // menu can override it. See docs/COUPLE_MODE.md.
  const Shell = mode === "couple" ? CoupleShell : PlannerShell;

  return (
    <TourProvider>
      <Shell>{showEmptyState ? <NoEventsState /> : <Outlet />}</Shell>
      {/* Planner only. Two reasons, both real:
          1. Couple mode swaps in Couple* page components on the SAME paths
             (see the mode checks below), but none of them carry `data-tour`
             attributes — so findTourForPath() matches a tour by route and then
             Joyride has nothing to anchor to. Guests, Seating and Money would
             offer a tour with 0 of its steps mountable.
          2. `fixed bottom-6 right-6` lands the bubble on top of CoupleShell's
             mobile tab bar, covering the "Big Day" tab.
          Couples still reach support via "Get help" in the account menu.
          Re-enable once couple-specific tours exist — see docs/COUPLE_MODE.md. */}
      {mode === "planner" && <HelpBubble />}
      {/* Nudges the user to take an offline copy of their guest list as the
          big day approaches. Skipped until they actually have an event. */}
      {!showEmptyState && <ExportBackupReminder />}
    </TourProvider>
  );
}

import EventsPage from "../components/pages/Events/EventsPage";
// import EventFormModal from "../components/molecules/EventFormModal";
import EditEventModal from "../components/pages/Events/EditEventModal";

import RsvpsPage from "../components/pages/RSVPs/RsvpsPage";
import RsvpDesignV3Page from "../components/pages/RSVPs/RsvpDesignV3Page";
import RsvpSharePreviewPage from "../components/pages/RSVPs/RsvpSharePreviewPage";
// import RsvpDetail from "../components/pages/RSVPs/RsvpDetail";
// import rsvp from "../components/pages/RSVPs/NewRsvpModal";
// import EditRsvpModal from "../components/pages/RSVPs/EditRsvpModal";

import GuestsPage from "../components/pages/Guests/GuestsPage";
import CoupleGuestsPage from "../components/pages/Guests/CoupleGuestsPage";
import GuestCheckInPrintView from "../components/pages/Guests/GuestCheckInPrintView";

/**
 * Guests is the first page with a per-mode body: couple mode shows RSVPs and
 * Guests merged into one list, planner mode keeps the operational grid. Same
 * route either way. See docs/COUPLE_MODE.md.
 */
function GuestsRoute() {
  const { mode } = useUiMode();
  return mode === "couple" ? <CoupleGuestsPage /> : <GuestsPage />;
}

/**
 * Home: couple mode answers "what do we do next?", planner mode keeps the
 * six-panel dashboard. Same route either way.
 */
function HomeRoute() {
  const { mode } = useUiMode();
  return mode === "couple" ? <CoupleHomePage /> : <MemberDashboardPage />;
}

/** Seating: couple mode taps to assign, planner mode keeps the operational grid. */
function SeatingRoute() {
  const { mode } = useUiMode();
  return mode === "couple" ? <CoupleSeatingPage /> : <TablesPageV3 />;
}

/** Money: couple mode leads with what's owed and overdue. */
function BudgetRoute() {
  const { mode } = useUiMode();
  return mode === "couple" ? <CoupleBudgetPage /> : <BudgetPage />;
}

/**
 * Big Day: couple mode puts the day-of helper list above the scanner, because
 * the tab already claims /app/crew (see coupleSections.ts) and nothing else in
 * couple mode links there. Planner mode gets the bare scanner.
 *
 * Crew (role 6) is excluded explicitly: a crew member signing in on a browser
 * that already has `uiMode=couple` in localStorage would otherwise be offered
 * the helper-management list. Helpers don't manage helpers.
 */
function BigDayRoute() {
  const { mode } = useUiMode();
  const { userRole } = useAuth();
  return mode === "couple" && userRole !== 6 ? <CoupleBigDayPage /> : <CheckInPage />;
}

import TablesPage from "../components/pages/Tables/TablesPage";
import TablesPageV3 from "../components/pages/Tables/TablesPageV3";
import CoupleSeatingPage from "../components/pages/Tables/CoupleSeatingPage";
// import TableDetail from "../components/pages/Tables/TableDetail";
// import TableFormModal from "../components/molecules/TableFormModal";
import EditTableModal from "../components/pages/Tables/EditTableModal";


import UsersPage from "../components/pages/Users/UsersPage";
// import UserDetail from "../components/pages/Users/UserDetail";
// import UserFormModal from "../components/molecules/UserFormModal";
import EditUserModal from "../components/pages/Users/EditUserModal";

import BudgetPage from "../components/pages/Budget/BudgetPage";
import CoupleBudgetPage from "../components/pages/Budget/CoupleBudgetPage";

import MemberDashboardPage from "../components/pages/Dashboard/MemberDashboardPage";
import CoupleHomePage from "../components/pages/Dashboard/CoupleHomePage";

import RSVPPublicPage from "../components/pages/Public/RSVPPublic/RSVPPublicPage";
import RsvpBySlugPage from "../components/pages/Public/RSVPPublic/RsvpBySlugPage";
import { EventFormModal } from "../components/molecules/EventFormModal";
import { NewRsvpModal } from "../components/pages/RSVPs/NewRsvpModal";
import { EditRsvpModal } from "../components/pages/RSVPs/EditRsvpModal";
import { TableFormModal } from "../components/molecules/TableFormModal";
import { UserFormModal } from "../components/molecules/UserFormModal";
import FormFieldsPage from "../components/pages/Events/FormFieldsPage";
import { TableAssignments } from "../components/pages/Tables/TableAssignments";
import TableDetail from "../components/pages/Tables/TableDetail";
import { TableLayoutPlanner } from "../components/pages/Tables/TableLayoutPlanner";
import { TablePrintView } from "../components/pages/Tables/TablePrintView";
import { TableSummary } from "../components/pages/Tables/TableSummary";
import FloorPlanPage from "../components/pages/Tables/FloorPlanPage";
import TablesFullscreenPage from "../components/pages/Tables/TablesFullscreenPage";
import CheckInPage from "../components/pages/CheckIn/CheckInPage";
import CoupleBigDayPage from "../components/pages/CheckIn/CoupleBigDayPage";
import QrLookupPage from "../components/pages/Public/QrLookup/QrLookupPage";
import RequireAuth from "../components/RequireAuth";
import { useAuth } from "../api/hooks/useAuth";
import CrewPage from "../components/pages/Crew/CrewPage";
import ChecklistPage from "../components/pages/Checklist/ChecklistPage";
import TutorialPage from "../components/pages/Tutorial/TutorialPage";
import ContactSupportPage from "../components/pages/Contact/ContactSupportPage";
// …and other Public pages…

export default function AppRoutes() {
  const navigate = useNavigate();

  return (
    <Routes>
      {/* ─── STANDALONE PROTECTED (no sidebar/navbar — full viewport) ─── */}
      <Route path="/app/tables/fullscreen" element={<RequireAuth><TablesFullscreenPage /></RequireAuth>} />

      {/* ─── STANDALONE PUBLIC (no navbar/footer) ───────── */}
      <Route path="/rsvp/submit/:token" element={<RSVPPublicPage />} />
      <Route path="/rsvp/:slug" element={<RsvpBySlugPage />} />
      <Route path="/rsvp/share/:token" element={<RsvpSharePreviewPage />} />

      {/* ─── AUTH (standalone, no navbar/footer) ─────────── */}
      <Route path="/login" element={<LoginPage />} />
      {/* Dedicated crew (event-day staff) sign-in — shared via invite, kept out of the public nav */}
      <Route path="/crew-login" element={<CrewLoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      {/* Reached from the password-reset email deep-link (?email=&token=) in all envs */}
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* ─── PUBLIC ───────────────────────────────────────── */}
      <Route element={<PublicTemplate />}>
        <Route path="/" element={<LandingPage />} />

        {/* public landing pages */}
        <Route path="/rsvp"    element={<RSVPPublicPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/contact" element={<ContactPage />} />
        {/* Guest self-service QR lookup */}
        <Route path="/qr/lookup/:eventId" element={<QrLookupPage />} />
      </Route>

      {/* ─── PROTECTED / DASHBOARD ─────────────────────────── */}
      <Route path="/app" element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route index element={<Navigate to="dashboard" replace />} />

        {/* DASHBOARD — body varies by UI mode, route does not */}
        <Route path="dashboard" element={<HomeRoute />} />

        {/* EVENTS */}
        <Route path="events" element={<Outlet />}>
          <Route index element={<EventsPage />} />
          <Route
            path="new"
            element={<EventFormModal isOpen onClose={() => navigate(-1)} />}
          />
          <Route path=":id/edit" element={<EditEventModal />} />
          <Route path=":id/form-fields" element={<FormFieldsPage />} />
        </Route>

        {/* RSVP QUESTIONS (sidebar sub-link, uses current event from context) */}
        <Route path="form-fields" element={<FormFieldsPage />} />

        {/* RSVPs (no :eventId in the URL) */}
        <Route path="rsvps" element={<Outlet />}>
          <Route index element={<RsvpsPage />} />
          <Route path="designer-v3" element={<RsvpDesignV3Page />} />
          <Route path="new" element={<NewRsvpModal />} />
          <Route path=":id/edit" element={<EditRsvpModal />} />
        </Route>

        {/* GUESTS — body varies by UI mode, route does not */}
        <Route path="guests" element={<Outlet />}>
          <Route index element={<GuestsRoute />} />
          <Route path="print" element={<GuestCheckInPrintView />} />
        </Route>

        {/* ─── TABLES ─────────────────────────────────────────── */}
<Route path="tables" element={<Outlet/>}>
  <Route index element={<TablesPage />} />
  {/* Body varies by UI mode, route does not */}
  <Route path="v3" element={<SeatingRoute />} />
  <Route path="floorplan" element={<FloorPlanPage />} />
  <Route path="new" element={
    <TableFormModal isOpen onClose={() => navigate(-1)} />
  }/>

  <Route path=":tableId" element={<TableDetail />}>
    {/* ← now this is the “index” child under /app/tables/:tableId */}
    <Route index         element={<TableSummary      />} />
    <Route path="assignments" element={<TableAssignments />} />
    <Route path="layout"      element={<TableLayoutPlanner />} />
    <Route path="print"       element={<TablePrintView   />} />
    <Route path="edit"        element={<EditTableModal   />} />
  </Route>
</Route>
        {/* USERS */}
        <Route path="users" element={<Outlet />}>
          <Route index element={<UsersPage />} />
          <Route
            path="new"
            element={<UserFormModal isOpen onClose={() => navigate(-1)} />}
          />
          <Route path=":id/edit" element={<EditUserModal />} />
        </Route>

        {/* CREW */}
        <Route path="crew" element={<CrewPage />} />

        {/* CHECKLIST */}
        <Route path="checklist" element={<ChecklistPage />} />

        {/* CHECK-IN — body varies by UI mode, route does not */}
        <Route path="checkin" element={<BigDayRoute />} />

        {/* BUDGET */}
        {/* Body varies by UI mode, route does not */}
        <Route path="budget" element={<BudgetRoute />} />

        {/* TUTORIAL */}
        <Route path="tutorial" element={<TutorialPage />} />

        {/* CONTACT / SUPPORT */}
        <Route path="contact" element={<ContactSupportPage />} />

        {/* any other /app/* → back to dashboard */}
        <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
      </Route>

      {/* global 404 fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
