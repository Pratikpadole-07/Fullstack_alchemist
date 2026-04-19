import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import NewEvent from "./pages/NewEvent.jsx";
import EventDetail from "./pages/EventDetail.jsx";
import PaymentPage from "./pages/PaymentPage.jsx";
import AdminReview from "./pages/AdminReview.jsx";
import AdminReports from "./pages/AdminReports.jsx";

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route
          path="/events/new"
          element={
            <PrivateRoute roles={["organizer", "admin"]}>
              <NewEvent />
            </PrivateRoute>
          }
        />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route
          path="/payment/:eventId"
          element={
            <PrivateRoute roles={["user", "organizer", "admin"]}>
              <PaymentPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/review"
          element={
            <PrivateRoute roles={["admin"]}>
              <AdminReview />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <PrivateRoute roles={["admin"]}>
              <AdminReports />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}
