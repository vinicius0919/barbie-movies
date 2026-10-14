
import { useCallback, useState } from "react";

import { useAuth } from "../contexts/AuthContext";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { user } = useAuth();

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  return (
    <div className="layout">
      <Navbar toggleSidebar={toggleSidebar} />

      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={closeSidebar}
        user={user}
      />

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
