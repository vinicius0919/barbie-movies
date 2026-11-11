import "./Sidebar.css";

import { useEffect } from "react";

import { Home, Settings, Tv, Heart, X, Layers3 } from "lucide-react";

import { NavLink, useLocation } from "react-router-dom";

export default function Sidebar({ sidebarOpen, setSidebarOpen, user = null }) {
  const location = useLocation();

  const isAdmin = user?.role === "admin";

  // Fecha o menu ao navegar.
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, setSidebarOpen]);

  // Bloqueia a rolagem do fundo
  // enquanto o menu estiver aberto.
  useEffect(() => {
    if (!sidebarOpen) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarOpen]);

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const getLinkClass = ({ isActive }) =>
    `sidebar-link ${isActive ? "active" : ""}`;

  return (
    <>
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar ${sidebarOpen ? "open" : ""}`}
        aria-label="Menu principal"
      >
        <div className="sidebar-header">
          <h2>Menu</h2>

          <button type="button" onClick={closeSidebar} aria-label="Fechar menu">
            <X size={24} />
          </button>
        </div>

        <nav aria-label="Navegação principal">
          {/* INÍCIO */}

          <NavLink to="/" end className={getLinkClass} onClick={closeSidebar}>
            <Home size={20} />
            <span>Início</span>
          </NavLink>

          {/* SÉRIES */}

          <NavLink to="/series" className={getLinkClass} onClick={closeSidebar}>
            <Tv size={20} />
            <span>Séries</span>
          </NavLink>

          {/* COLEÇÕES */}

          <NavLink
            to="/collections"
            className={getLinkClass}
            onClick={closeSidebar}
          >
            <Layers3 size={20} />
            <span>Coleções</span>
          </NavLink>

          {/* MINHA LISTA */}

          <NavLink
            to="/favorites"
            className={getLinkClass}
            onClick={closeSidebar}
          >
            <Heart size={20} />
            <span>Minha Lista</span>
          </NavLink>

          {/* ADMINISTRAÇÃO */}

          {isAdmin && (
            <>
              <div className="sidebar-divider" />

              <NavLink
                to="/admin"
                className={getLinkClass}
                onClick={closeSidebar}
              >
                <Settings size={20} />
                <span>Administração</span>
              </NavLink>

              <NavLink
                to="/admin/series"
                className={getLinkClass}
                onClick={closeSidebar}
              >
                <Tv size={20} />
                <span>Gerenciar Séries</span>
              </NavLink>

              <NavLink
                to="/admin/collections"
                className={getLinkClass}
                onClick={closeSidebar}
              >
                <Layers3 size={20} />
                <span>Gerenciar Coleções</span>
              </NavLink>
            </>
          )}
        </nav>
      </aside>
    </>
  );
}
