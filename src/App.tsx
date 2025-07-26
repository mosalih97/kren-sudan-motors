
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import { useSecurityMonitor } from "@/hooks/useSecurityMonitor";
import { useSessionManager } from "@/hooks/useSessionManager";
import Index from "./pages/Index";
import Cars from "./pages/Cars";
import AddAd from "./pages/AddAd";
import AdDetails from "./pages/AdDetails";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import Auth from "./pages/Auth";
import SearchResults from "./pages/SearchResults";
import PasswordReset from "./pages/PasswordReset";
import BoostAd from "./pages/BoostAd";
import UploadReceipt from "./pages/UploadReceipt";
import NotFound from "./pages/NotFound";
import Notifications from "./pages/Notifications";
import SellerAds from "./pages/SellerAds";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const AppContent = () => {
  useSecurityMonitor();
  useSessionManager();
  
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/cars" element={<Cars />} />
      <Route path="/add-ad" element={
        <ProtectedRoute>
          <AddAd />
        </ProtectedRoute>
      } />
      <Route path="/ad/:id" element={<AdDetails />} />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/messages" element={
        <ProtectedRoute>
          <Messages />
        </ProtectedRoute>
      } />
      <Route path="/notifications" element={
        <ProtectedRoute>
          <Notifications />
        </ProtectedRoute>
      } />
      <Route path="/seller-ads" element={
        <ProtectedRoute>
          <SellerAds />
        </ProtectedRoute>
      } />
      <Route path="/boost/:id" element={
        <ProtectedRoute>
          <BoostAd />
        </ProtectedRoute>
      } />
      <Route path="/upload-receipt" element={
        <ProtectedRoute>
          <UploadReceipt />
        </ProtectedRoute>
      } />
      <Route path="/auth" element={<Auth />} />
      <Route path="/search" element={<SearchResults />} />
      <Route path="/reset-password" element={<PasswordReset />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AuthProvider>
            <AdminAuthProvider>
              <AppContent />
            </AdminAuthProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
