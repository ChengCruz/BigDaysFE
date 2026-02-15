// src/routers/AppRoutes.tsx
import { Routes, Route, Navigate, Outlet, useNavigate } from "react-router-dom";

import LandingPage from "../components/pages/Landing/LandingPage";
import LoginPage from "../components/pages/Auth/LoginPage";
import PublicTemplate from "../components/templates/PublicTemplate";
import DashboardTemplate from "../components/templates/DashboardTemplate";

import EventsPage from "../components/pages/Events/EventsPage";
// import EventFormModal from "../components/molecules/EventFormModal";
import EditEventModal from "../components/pages/Events/EditEventModal";

import RsvpsPage from "../components/pages/RSVPs/RsvpsPage";
import RsvpDesignPage from "../components/pages/RSVPs/RsvpDesignPage";
import RsvpSharePreviewPage from "../components/pages/RSVPs/RsvpSharePreviewPage";
// import RsvpDetail from "../components/pages/RSVPs/RsvpDetail";
// import rsvp from "../components/pages/RSVPs/NewRsvpModal";
// import EditRsvpModal from "../components/pages/RSVPs/EditRsvpModal";

import GuestsPage from "../components/pages/Guests/GuestsPage";

import TablesPage from "../components/pages/Tables/TablesPage";
// import TableDetail from "../components/pages/Tables/TableDetail";
// import TableFormModal from "../components/molecules/TableFormModal";
import EditTableModal from "../components/pages/Tables/EditTableModal";

import SeatingPage from "../components/pages/Seating/SeatingPage";
// import SeatingDetail from "../components/pages/Seating/SeatingDetail";
// import SeatingFormModal from "../components/molecules/SeatingFormModal";
import EditSeatingModal from "../components/pages/Seating/EditSeatingModal";

import UsersPage from "../components/pages/Users/UsersPage";
// import UserDetail from "../components/pages/Users/UserDetail";
// import UserFormModal from "../components/molecules/UserFormModal";
import EditUserModal from "../components/pages/Users/EditUserModal";

import WalletPage from "../components/pages/Wallet/WalletPage";

import MemberDashboardPage from "../components/pages/Dashboard/MemberDashboardPage";

import RSVPPublicPage from "../components/pages/Public/RSVPPublic/RSVPPublicPage";
import EventPublicPage from "../components/pages/Public/EventsPublic/EventsPublicPage";
import { EventFormModal } from "../components/molecules/EventFormModal";
import { NewRsvpModal } from "../components/pages/RSVPs/NewRsvpModal";
import { EditRsvpModal } from "../components/pages/RSVPs/EditRsvpModal";
import { TableFormModal } from "../components/molecules/TableFormModal";
import { SeatingFormModal } from "../components/molecules/SeatingFormModal";
import { UserFormModal } from "../components/molecules/UserFormModal";
import FormFieldsPage from "../components/pages/Events/FormFieldsPage";
import { TableAssignments } from "../components/pages/Tables/TableAssignments";
import TableDetail from "../components/pages/Tables/TableDetail";
import { TableLayoutPlanner } from "../components/pages/Tables/TableLayoutPlanner";
import { TablePrintView } from "../components/pages/Tables/TablePrintView";
import { TableSummary } from "../components/pages/Tables/TableSummary";
// …and other Public pages…

export default function AppRoutes() {
  const navigate = useNavigate();

  return (
    <Routes>
      {/* ─── PUBLIC ───────────────────────────────────────── */}
      <Route element={<PublicTemplate />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* public landing pages */}
        <Route path="/events" element={<EventPublicPage />} />
        <Route path="/rsvp" element={<RSVPPublicPage />} />
        <Route path="/rsvp/share/:token" element={<RsvpSharePreviewPage />} />
        {/* … other public pages … */}
      </Route>

      {/* ─── PROTECTED / DASHBOARD ─────────────────────────── */}
      <Route path="/app" element={<DashboardTemplate />}>
        <Route index element={<Navigate to="dashboard" replace />} />

        {/* DASHBOARD */}
        <Route path="dashboard" element={<MemberDashboardPage />} />

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

        {/* RSVPs (no :eventId in the URL) */}
        <Route path="rsvps" element={<Outlet />}>
          <Route index element={<RsvpsPage />} />
          <Route path="designer" element={<RsvpDesignPage />} />
          <Route path="new" element={<NewRsvpModal />} />
          <Route path=":id/edit" element={<EditRsvpModal />} />
        </Route>

        {/* GUESTS */}
        <Route path="guests" element={<GuestsPage />} />

        {/* ─── TABLES ─────────────────────────────────────────── */}
<Route path="tables" element={<Outlet/>}>
  <Route index element={<TablesPage />} />

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
        {/* SEATING */}
        <Route path="seating" element={<Outlet />}>
          <Route index element={<SeatingPage />} />
          <Route
            path="new"
            element={<SeatingFormModal isOpen onClose={() => navigate(-1)} />}
          />
          <Route path=":id/edit" element={<EditSeatingModal />} />
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

        {/* WALLET */}
        <Route path="wallet" element={<WalletPage />} />

        {/* any other /app/* → back to dashboard */}
        <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
      </Route>

      {/* global 404 fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
