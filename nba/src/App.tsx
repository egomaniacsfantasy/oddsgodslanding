import { useState } from "react";
import StandingsPage from "./components/StandingsPage";
import SchedulePage from "./components/SchedulePage";
import RankingsPage from "./components/RankingsPage";
import SimPage from "./components/SimPage";
import ManagerModePage from "./components/ManagerModePage";
import "./App.css";

type Tab = "standings" | "schedule" | "rankings" | "sim" | "manager";
const TAB_LABELS: Record<Tab, string> = {
  standings: "Standings",
  schedule: "Schedule",
  rankings: "Rankings",
  sim: "Sim",
  manager: "Manager",
};

export default function App() {
  const [tab, setTab] = useState<Tab>("standings");
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand">
            <a href="/" className="brand-link">Odds Gods</a>
            <span className="brand-sep"> / </span>
            <span className="brand-page">NBA Season Sim</span>
          </div>
          <nav className="tab-nav">
            {(["standings","schedule","rankings","sim","manager"] as Tab[]).map((t) => (
              <button key={t} className={`tab-btn${tab===t?" active":""}`} onClick={() => setTab(t)}>
                {TAB_LABELS[t]}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main className="app-main">
        {tab === "standings" && <StandingsPage />}
        {tab === "schedule"  && <SchedulePage />}
        {tab === "rankings"  && <RankingsPage />}
        {tab === "sim"       && <SimPage />}
        {tab === "manager"   && <ManagerModePage />}
      </main>
      <footer className="app-footer">
        <p>Powered by LightGBM &middot; 50,000 simulations &middot; Updated daily</p>
      </footer>
    </div>
  );
}
