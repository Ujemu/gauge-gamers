import React, { useState } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import Landing from "./pages/Landing";
import LeaderboardPage from "./pages/LeaderboardPage";
import SplashScreen from "./components/SplashScreen";
import AudioToggle from "./components/AudioToggle";
import "./index.css";

/** Shared centered layout for every routed page */
function CenteredLayout() {
  return (
    <main className="container">
      <div className="stack">
        {/* Constrain each page to a consistent width */}
        <section className="section">
          <Outlet />
        </section>
      </div>
    </main>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <div className="app-overlay">
      {showSplash ? (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      ) : (
        <Routes>
          {/* All pages render inside the same centered layout */}
          <Route element={<CenteredLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}

      {/* Global audio control */}
      <AudioToggle src="/assets/bg-music.mp3" volume={0.45} defaultEnabled />
    </div>
  );
}
