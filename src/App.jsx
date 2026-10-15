import { Routes, Route } from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import SubscriptionRoute from "./components/SubscriptionRoute";

// Páginas principais
import Home from "./pages/Home";
import Player from "./pages/Player";
import Favorites from "./pages/Favorites";

// Séries
import SeriesCatalog from "./pages/SeriesCatalog";
import SeriesManager from "./pages/SeriesManager";
import SeriesDetails from "./pages/SeriesDetails";

// Administração
import Admin from "./pages/Admin";

// Autenticação e assinaturas
import AuthPage from "./pages/AuthPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import CheckoutReturn from "./pages/CheckoutReturn";

import "./App.css";

export default function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          {/* ================================
              PÁGINAS PÚBLICAS
          ================================= */}

          <Route path="/" element={<Home />} />

          <Route path="/login" element={<AuthPage mode="login" />} />

          <Route path="/register" element={<AuthPage mode="register" />} />

          <Route path="/subscription" element={<SubscriptionPage />} />

          <Route path="/series" element={<SeriesCatalog />} />
          {/* ================================
              ROTAS AUTENTICADAS
          ================================= */}

          <Route element={<ProtectedRoute />}>
            <Route path="/checkout/retorno" element={<CheckoutReturn />} />

            <Route path="/favorites" element={<Favorites />} />

            {/* ================================
                CONTEÚDO PARA ASSINANTES
            ================================= */}

            <Route element={<SubscriptionRoute />}>
              <Route path="/movie/:id" element={<Player />} />


              <Route path="/series/:id" element={<SeriesDetails />} />
            </Route>

            {/* ================================
                ADMINISTRAÇÃO
            ================================= */}

            <Route element={<ProtectedRoute adminOnly />}>
              <Route path="/admin" element={<Admin />} />

              <Route path="/admin/series" element={<SeriesManager />} />
            </Route>
          </Route>

          {/* ================================
              PÁGINA NÃO ENCONTRADA
          ================================= */}

          <Route
            path="*"
            element={
              <div className="not-found-page">
                <h1>Página não encontrada</h1>
                <p>O endereço solicitado não existe.</p>
              </div>
            }
          />
        </Routes>
      </Layout>
    </AuthProvider>
  );
}
