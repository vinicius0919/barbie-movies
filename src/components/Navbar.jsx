import "./Navbar.css";

import {
  Menu,
  Search,
  UserRound,
  ChevronDown,
  CreditCard,
  LogOut,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";

import { Link, useLocation, useNavigate } from "react-router-dom";

import { useDebounce } from "use-debounce";

import Miq from "./../assets/fada.png";

import { useSearch } from "../contexts/SearchContext";
import { useAuth } from "../contexts/AuthContext";
import { GENRE_ROWS } from "../config/genres";

export default function Navbar({ toggleSidebar }) {
  const { setSearch, genreFilter, setGenreFilter } = useSearch();

  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();

  const navigate = useNavigate();
  const accountRef = useRef(null);

  const [value, setValue] = useState("");
  const [debouncedValue] = useDebounce(value, 500);

  const [accountOpen, setAccountOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const location = useLocation();

  const showMovieSearch = location.pathname === "/";

  // =============================================
  // PESQUISA
  // =============================================

  useEffect(() => {
    setSearch(debouncedValue);
  }, [debouncedValue, setSearch]);

  // =============================================
  // MENU DE CONTA
  // =============================================

  useEffect(() => {
    if (!accountOpen) return;

    function handleOutsideClick(event) {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setAccountOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setAccountOpen(false);
      }
    }

    document.addEventListener("pointerdown", handleOutsideClick);

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);

      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [accountOpen]);

  // =============================================
  // LOGOUT
  // =============================================

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    setLogoutError("");

    try {
      await logout();

      setAccountOpen(false);
      navigate("/", { replace: true });
    } catch (error) {
      setLogoutError(error.message || "Não foi possível sair da conta.");
    } finally {
      setLoggingOut(false);
    }
  }

  // =============================================
  // INFORMAÇÕES DO USUÁRIO
  // =============================================

  const displayName =
    user?.name?.trim() || user?.email?.split("@")[0] || "Minha conta";

  const initial = displayName.charAt(0).toLocaleUpperCase("pt-BR");

  // =============================================
  // RENDERIZAÇÃO
  // =============================================

  return (
    <header className="navbar">
      {/* TOPO */}
      <div className="row navbar-top">
        <div className="navbar-brand-area">
          <button
            type="button"
            className="menu-button"
            onClick={toggleSidebar}
            aria-label="Abrir ou fechar menu lateral"
          >
            <Menu size={28} />
          </button>

          <Link
            to="/"
            className="logo-wrapper"
            aria-label="MiqFlix - Página inicial"
          >
            <img src={Miq} alt="" className="MiqFace" />

            <h1 className="logo">MiqFlix</h1>
          </Link>
        </div>

        {/* ÁREA DE AUTENTICAÇÃO */}
        <div className="navbar-auth">
          {!authLoading && !isAuthenticated && (
            <div className="navbar-guest-actions">
              <Link to="/login" className="navbar-login-link">
                Entrar
              </Link>

              <Link to="/subscription" className="navbar-subscribe-link">
                Assinar
              </Link>
            </div>
          )}

          {!authLoading && isAuthenticated && (
            <div className="navbar-account" ref={accountRef}>
              <button
                type="button"
                className="navbar-account-trigger"
                aria-expanded={accountOpen}
                aria-haspopup="true"
                aria-controls="navbar-account-menu"
                onClick={() => {
                  setAccountOpen((current) => !current);
                  setLogoutError("");
                }}
              >
                <span className="navbar-avatar">{initial}</span>

                <span className="navbar-account-label">{displayName}</span>

                <ChevronDown
                  size={16}
                  className={accountOpen ? "chevron-open" : ""}
                />
              </button>

              {accountOpen && (
                <div
                  id="navbar-account-menu"
                  className="navbar-account-dropdown"
                >
                  <div className="navbar-account-info">
                    <span className="navbar-avatar navbar-avatar-large">
                      {initial}
                    </span>

                    <div className="navbar-account-details">
                      <strong>{displayName}</strong>
                      <span>{user?.email}</span>
                    </div>
                  </div>

                  <div className="navbar-account-divider" />

                  <Link
                    to="/subscription"
                    className="navbar-account-item"
                    onClick={() => setAccountOpen(false)}
                  >
                    <CreditCard size={18} />
                    Minha assinatura
                  </Link>

                  <button
                    type="button"
                    className="navbar-account-item navbar-logout"
                    onClick={handleLogout}
                    disabled={loggingOut}
                  >
                    <LogOut size={18} />

                    {loggingOut ? "Saindo..." : "Sair da conta"}
                  </button>

                  {logoutError && (
                    <p className="navbar-logout-error" role="alert">
                      {logoutError}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* PESQUISA */}

      {/* PESQUISA GLOBAL DE FILMES */}

      {showMovieSearch && (
        <div className="row navbar-search">
          <select
            className="genre-select"
            value={genreFilter}
            onChange={(event) => setGenreFilter(event.target.value)}
            aria-label="Filtrar por gênero"
          >
            <option value="">Todos</option>

            {GENRE_ROWS?.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>

          <div className="search-box">
            <Search size={18} />

            <input
              type="text"
              placeholder="Buscar filmes..."
              value={value}
              onChange={(event) => setValue(event.target.value)}
              aria-label="Buscar filmes"
            />
          </div>
        </div>
      )}
    </header>
  );
}
