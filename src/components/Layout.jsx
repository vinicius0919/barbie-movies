import { useState } from "react";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  function toggleSidebar() {
    console.log(sidebarOpen)
    setSidebarOpen(!sidebarOpen);
  }

  return (
    <div className="layout">
      <Navbar
        toggleSidebar={toggleSidebar}
      />

      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}