import { Menu } from "lucide-react";

export default function Navbar({
  toggleSidebar,
}) {
  return (
    <header className="navbar">
      <button
        className="menu-button"
        onClick={toggleSidebar}
      >
        <Menu size={28} />
      </button>

      <h1 className="logo">
        Barbie Stream
      </h1>
    </header>
  );
}