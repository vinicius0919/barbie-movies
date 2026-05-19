import "./Navbar.css"

import {
  Menu,
  Search,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import { useDebounce }
  from "use-debounce";

import Miq from "./../assets/fada.png";

import { useSearch } from "../context/SearchContext";

export default function Navbar({
  toggleSidebar,
}) {
  const {
    setSearch,
  } = useSearch();

  const [value, setValue] =
    useState("");

  const [debouncedValue] =
    useDebounce(value, 500);

  useEffect(() => {
    setSearch(debouncedValue);
  }, [debouncedValue]);

  return (
    <header className="navbar">
      <button
        className="menu-button"
        onClick={toggleSidebar}
      >
        <Menu size={28} />
      </button>

      <div className="logo-wrapper">
        <img
          src={Miq}
          alt=""
          className="MiqFace"
        />

        <h1 className="logo">
          MiqFlix
        </h1>
      </div>

      <div className="search-box">
        <Search size={18} />

        <input
          type="text"
          placeholder="Buscar filmes..."
          value={value}
          onChange={(e) =>
            setValue(
              e.target.value
            )
          }
        />
      </div>
    </header>
  );
}