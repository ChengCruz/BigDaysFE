import { Routes, Route, Navigate, Outlet, useNavigate } from "react-router-dom";
import LandingPage from "../components/pages/Landing/LandingPage";
// import AuthTemplate  from "../components/templates/AuthTemplate";
import LoginPage from "../components/pages/Auth/LoginPage";
import DashboardTemplate from "../components/templates/DashboardTemplate";
import EventsPage from "../components/pages/Events/EventsPage";
import RsvpsPage from "../components/pages/RSVPs/RsvpsPage";
import PublicTemplate from "../components/templates/PublicTemplate";
import ContactPage from "../components/pages/Auth/ContactPage";
import CouplePage from "../components/pages/Public/Couple/CouplePage";
import StoryPage from "../components/pages/Public/Story/StoryPage";
import EventsPublicPage from "../components/pages/Public/EventsPublic/EventsPublicPage";
import PeoplePage from "../components/pages/Public/People/PeoplePage";
import GalleryPage from "../components/pages/Public/Gallery/GalleryPage";
import RSVPPublicPage from "../components/pages/Public/RSVPPublic/RSVPPublicPage";
import BlogPage from "../components/pages/Public/Blog/BlogPage";
import TablesPage from "../components/pages/Tables/TablesPage";
import SeatingPage from "../components/pages/Seating/SeatingPage";
import UsersPage from "../components/pages/Users/UsersPage";
import CostingPage from "../components/pages/Costing/CostingPage";
// import RequireAuth from "../components/RequireAuth";
import { EventFormModal } from "../components/molecules/EventFormModal";
import EventDetail from "../components/pages/Events/EventDetail";
import { RsvpFormModal } from "../components/molecules/RsvpFormModal";
import RsvpDetail from "../components/pages/RSVPs/RsvpDetail";
import { TableFormModal } from "../components/molecules/TableFormModal";
import TableDetail from "../components/pages/Tables/TableDetail";
import EditTableModal from "../components/pages/Tables/EditTableModal";
import EditRsvpModal from "../components/pages/RSVPs/EditRsvpModal";
import { SeatingFormModal } from "../components/molecules/SeatingFormModal";
import EditSeatingModal from "../components/pages/Seating/EditSeatingModal";
import { UserFormModal } from "../components/molecules/UserFormModal";
import EditUserModal from "../components/pages/Users/EditUserModal";
import { CostFormModal } from "../components/molecules/CostFormModal";
import EditCostModal from "../components/pages/Costing/EditCostModal";
import CostDetail from "../components/pages/Costing/CostDetail";
import SeatingDetail from "../components/pages/Seating/SeatingDetail";
import UserDetail from "../components/pages/Users/UserDetail";
import RSVPFormPage from "../components/pages/Public/RSVPFormPage";
// import DashboardTemplate from "../components/templates/DashboardTemplate";

export default function AppRoutes() {
  const navigate = useNavigate();
  return (
    <Routes>
      {/* PUBLIC */}
      <Route element={<PublicTemplate />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/couple" element={<CouplePage />} />
        <Route path="/story" element={<StoryPage />} />
        <Route path="/events" element={<EventsPublicPage />} />
        <Route path="/people" element={<PeoplePage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/rsvp" element={<RSVPPublicPage />} />
        <Route path="/rsvp/:eventId" element={<RSVPFormPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* <Route element={<AuthTemplate />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/contact" element={<div>ContactPage (stub)</div>} />
      </Route> */}

      {/* PROTECTED */}
      <Route
        path="/app/*"
        element={
          // <RequireAuth>
            <DashboardTemplate />
          // </RequireAuth>
        }
      >
        {/* <Route index element={<Navigate to="events" replace />} /> */}
        {/* <Route path="events" element={<EventsPage />} /> */}
        <Route index element={<Navigate to="events" replace />} />

        {/* events now has nested detail/edit */}
        <Route path="events" element={<Outlet />}>
          <Route index element={<EventsPage />} />
          <Route
            path="new"
            element={<EventFormModal isOpen onClose={() => navigate(-1)} />}
          />
          <Route path=":id" element={<EventDetail />} />
          <Route
            path=":id/edit"
            element={
              <EventFormModal
                isOpen
                initial={{ id: "", title: "", date: "2023-01-01" }}
                onClose={() => navigate(-1)}
              />
            }
          />
        </Route>
        {/* <Route path="rsvps" element={<RsvpsPage />} /> */}
        <Route path="rsvps" element={<Outlet />}>
          <Route index element={<RsvpsPage />} />
          <Route
            path="new"
            element={<RsvpFormModal isOpen onClose={() => navigate(-1)} />}
          />
          <Route path=":id" element={<RsvpDetail />} />
          <Route path=":id/edit" element={<EditRsvpModal />} />
          {/* <Route
            path=":id/edit"
            element={
              <RsvpFormModal
                isOpen
                initial={{ id: "", guestName: "", status: "" }}
                onClose={() => navigate(-1)}
              />
            }
          />*/}
        </Route>

        {/* <Route path="tables" element={<TablesPage />} /> */}
        <Route path="tables" element={<Outlet />}>
          <Route index element={<TablesPage />} />
          <Route
            path="new"
            element={<TableFormModal isOpen onClose={() => navigate(-1)} />}
          />
          <Route path=":id" element={<TableDetail />} />
          <Route path=":id/edit" element={<EditTableModal />} />
        </Route>

        {/* <Route path="seating" element={<SeatingPage />} /> */}
        <Route path="seating" element={<Outlet />}>
          <Route index element={<SeatingPage />} />
          <Route
            path="new"
            element={<SeatingFormModal isOpen onClose={() => navigate(-1)} />}
          />
          <Route path=":id"    element={<SeatingDetail />} />
          <Route path=":id/edit" element={<EditSeatingModal />} />
        </Route>

        {/* <Route path="users" element={<UsersPage />} /> */}
               {/* Users */}
        <Route path="users" element={<Outlet />}>
          <Route index element={<UsersPage />} />
          <Route path="new"    element={<UserFormModal isOpen onClose={() => navigate(-1)} />} />
          <Route path=":id"    element={<UserDetail />} />
          <Route path=":id/edit" element={<EditUserModal />} />
        </Route>

        {/* <Route path="costing" element={<CostingPage />} /> */}
             <Route path="costing" element={<Outlet />}>
          <Route index element={<CostingPage />} />
          <Route path="new"    element={<CostFormModal isOpen onClose={() => navigate(-1)} />} />
          <Route path=":id"    element={<CostDetail />} />
          <Route path=":id/edit" element={<EditCostModal />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
