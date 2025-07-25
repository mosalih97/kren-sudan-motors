
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import PasswordReset from "./pages/PasswordReset";
import Profile from "./pages/Profile";
import Cars from "./pages/Cars";
import AdDetails from "./pages/AdDetails";
import AddAd from "./pages/AddAd";
import Messages from "./pages/Messages";
import SearchResults from "./pages/SearchResults";
import NotFound from "./pages/NotFound";
import Notifications from "./pages/Notifications";
import BoostAd from "./pages/BoostAd";
import SellerAds from "./pages/SellerAds";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/password-reset" element={<PasswordReset />} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/cars" element={<Cars />} />
              <Route path="/ad/:id" element={<AdDetails />} />
              <Route path="/add-ad" element={<ProtectedRoute><AddAd /></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/boost-ad/:id" element={<ProtectedRoute><BoostAd /></ProtectedRoute>} />
              <Route path="/seller-ads" element={<ProtectedRoute><SellerAds /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
