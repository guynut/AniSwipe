import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { Layout } from "@/components/layout";
import { HomePage } from "@/pages/home-page";
import { RecommendationPage } from "@/pages/recommendation-page";
import { VoiceActorsPage } from "@/pages/voice-actors-page";
import { WatchlistPage } from "@/pages/watchlist-page";

const App = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/watchlist" element={<WatchlistPage />} />
        <Route path="/recommendations" element={<RecommendationPage />} />
        <Route path="/voice-actors" element={<VoiceActorsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster richColors position="top-center" theme="dark" />
    </Layout>
  );
};

export default App;
