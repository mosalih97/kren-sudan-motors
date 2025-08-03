
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AddAd from "./pages/AddAd";
import AdDetails from "./pages/AdDetails";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import Cars from "./pages/Cars";
import SearchResults from "./pages/SearchResults";
import SellerAds from "./pages/SellerAds";
import BoostAd from "./pages/BoostAd";
import UploadReceipt from "./pages/UploadReceipt";
import PasswordReset from "./pages/PasswordReset";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/password-reset" element={<PasswordReset />} />
              <Route path="/cars" element={<Cars />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/ad/:id" element={<AdDetails />} />
              <Route path="/seller/:userId" element={<SellerAds />} />
              <Route path="/add-ad" element={<ProtectedRoute><AddAd /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/boost-ad/:id" element={<ProtectedRoute><BoostAd /></ProtectedRoute>} />
              <Route path="/upload-receipt" element={<ProtectedRoute><UploadReceipt /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
