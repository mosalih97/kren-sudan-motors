
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Cars from "./pages/Cars";
import AddAd from "./pages/AddAd";
import AdDetails from "./pages/AdDetails";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import PasswordReset from "./pages/PasswordReset";
import SellerAds from "./pages/SellerAds";
import BoostAd from "./pages/BoostAd";
import UploadReceipt from "./pages/UploadReceipt";
import SearchResults from "./pages/SearchResults";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import AdminUsers from "./pages/AdminUsers";
import AdminAds from "./pages/AdminAds";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/cars" element={<Cars />} />
              <Route path="/add-ad" element={<ProtectedRoute><AddAd /></ProtectedRoute>} />
              <Route path="/ad/:id" element={<AdDetails />} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/password-reset" element={<PasswordReset />} />
              <Route path="/seller-ads" element={<ProtectedRoute><SellerAds /></ProtectedRoute>} />
              <Route path="/boost-ad/:id" element={<ProtectedRoute><BoostAd /></ProtectedRoute>} />
              <Route path="/upload-receipt" element={<ProtectedRoute><UploadReceipt /></ProtectedRoute>} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
              <Route path="/admin/ads" element={<ProtectedRoute><AdminAds /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
