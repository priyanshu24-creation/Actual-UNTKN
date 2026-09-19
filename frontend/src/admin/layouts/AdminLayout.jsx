import { useState } from "react";
import { Outlet } from "react-router-dom";

import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = () => {
    setSidebarOpen(true);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="admin-layout">

      <AdminSidebar
        sidebarOpen={sidebarOpen}
        closeSidebar={closeSidebar}
      />

      <div className="admin-main">

        <AdminHeader
          openSidebar={openSidebar}
        />

        <main className="admin-content">
          <Outlet />
        </main>

      </div>

    </div>
  );
}

export default AdminLayout;