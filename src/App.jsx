import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";

import Home from "./pages/Home";
import Player from "./pages/Player";
import Admin from "./pages/Admin";

import "./App.css";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/movie/:id" element={<Player />} />

        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Layout>
  );
}
