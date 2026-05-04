import { Outlet } from "react-router-dom";

import TopNav from "../components/TopNav";

const AdminLayout = () => {
  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute -top-28 left-[15%] h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-25%] right-[5%] h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
      <TopNav />
      <main className="mx-auto max-w-6xl px-6 pb-16 pt-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
