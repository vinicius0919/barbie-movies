import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Layout from "./components/Layout";

import Home from "./pages/Home";
import Player from "./pages/Player";
import Admin from "./pages/Admin";
import Favorites from "./pages/Favorites";
import SeriesManager from "./pages/SeriesManager";
import SeriesDetails from "./pages/SeriesDetails";

import "./App.css";

export default function App() {
  return (
    <Layout>
      <Routes>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/movie/:id"
          element={<Player />}
        />

        <Route
          path="/admin"
          element={<Admin />}
        />

        <Route
          path="/series"
          element={<SeriesManager />}
        />

        {/* NOVA ROTA */}
        <Route
          path="/series/:id"
          element={<SeriesDetails />}
        />

        <Route
          path="/favorites"
          element={<Favorites />}
        />

      </Routes>
    </Layout>
  );
}