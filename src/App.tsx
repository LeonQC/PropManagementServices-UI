import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import ListingsPage from "./pages/ListingsPage";
import ComingSoonPage from "./pages/ComingSoonPage";
import LoginPage from "./pages/LoginPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AcquisitionsPage from "./pages/AcquisitionsPage";
import DealDetailPage from "./pages/DealDetailPage";
import RequireAuth from "./auth/RequireAuth";

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Everything else requires a session. */}
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/listings" replace />} />
          <Route path="/listings" element={<ListingsPage />} />
          {/* Destinations whose backends don't exist yet. */}
          <Route path="/dashboard" element={<ComingSoonPage title="Dashboard" />} />
          <Route path="/acquisitions" element={<AcquisitionsPage />} />
          <Route path="/acquisitions/:dealId" element={<DealDetailPage />} />
          <Route path="/map" element={<ComingSoonPage title="Map" />} />
          <Route path="/reports" element={<ComingSoonPage title="Reports" />} />
          <Route path="/admin" element={<AdminUsersPage />} />
          <Route path="*" element={<ComingSoonPage title="Not found" />} />
        </Route>
      </Route>
    </Routes>
  );
}
