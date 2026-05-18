import { Menu } from "lucide-react";
import Miq from "./../assets/fada.png"
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

      <div className="logo-wrapper">
        <img
          src={Miq}
          alt=""
          className="MiqFace"
        />

        <h1 className="logo">
          MiFlix
        </h1>
      </div>
    </header>
  );
}