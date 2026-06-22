import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import ListingsPage from "./pages/ListingsPage";
import ComingSoonPage from "./pages/ComingSoonPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/listings" replace />} />
        <Route path="/listings" element={<ListingsPage />} />
        {/* Destinations whose backends don't exist yet. */}
        <Route path="/dashboard" element={<ComingSoonPage title="Dashboard" />} />
        <Route path="/acquisitions" element={<ComingSoonPage title="Acquisitions" />} />
        <Route path="/map" element={<ComingSoonPage title="Map" />} />
        <Route path="/reports" element={<ComingSoonPage title="Reports" />} />
        <Route path="/admin" element={<ComingSoonPage title="Admin" />} />
        <Route path="*" element={<ComingSoonPage title="Not found" />} />
      </Route>
    </Routes>
  );
}
