import "./Sidebar.css";

import {
  Home,
  Settings,
  Clapperboard,
  FilmIcon,
  X,
} from "lucide-react";

import { Link } from "react-router-dom";

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
}) {
  return (
    <>
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      <aside
        className={`sidebar ${
          sidebarOpen ? "open" : ""
        }`}
      >
        <div className="sidebar-header">
          <h2>Menu</h2>

          <button
            onClick={() =>
              setSidebarOpen(false)
            }
          >
            <X size={24} />
          </button>
        </div>

        <nav>
          <Link
            to="/"
            className="sidebar-link"
          >
            <Home size={20} />
            Home
          </Link>

          <Link
            to="/admin"
            className="sidebar-link"
          >
            <Settings size={20} />
            Admin
          </Link>

          <Link
            to="/series"
            className="sidebar-link"
          >
            <FilmIcon size={20} />
            Séries
          </Link>

          <Link
            to="/favorites"
            className="sidebar-link"
          >
            <Clapperboard size={20} />
            Favoritos
          </Link>
        </nav>
      </aside>
    </>
  );
}