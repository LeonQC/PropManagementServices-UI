import { Outlet } from "react-router-dom";
import TopNav from "./TopNav";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-page">
      <TopNav />
      <main className="mx-auto max-w-[1400px] px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
