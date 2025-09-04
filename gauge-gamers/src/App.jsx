import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import LeaderboardPage from "./pages/LeaderboardPage";
import SplashScreen from "./components/SplashScreen";
import "./index.css";
import AudioToggle from "./components/AudioToggle";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <div className="app-overlay">
      {showSplash ? (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      ) : (
        <>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </>
      )}

      {/* Always visible: will try to autoplay immediately */}
      <AudioToggle src="/assets/bg-music.mp3" volume={0.45} defaultEnabled />
    </div>
  );
}
