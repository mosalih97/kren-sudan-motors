
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AdminAuthProvider } from "./contexts/AdminAuthContext";
import { SecurityProvider } from "./contexts/SecurityContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Cars from "./pages/Cars";
import AddAd from "./pages/AddAd";
import AdDetails from "./pages/AdDetails";
import SearchResults from "./pages/SearchResults";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import BoostAd from "./pages/BoostAd";
import SellerAds from "./pages/SellerAds";
import UploadReceipt from "./pages/UploadReceipt";
import PasswordReset from "./pages/PasswordReset";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPasswordReset from "./components/admin/AdminPasswordReset";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/admin/AdminProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SecurityProvider>
        <AuthProvider>
          <AdminAuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/cars" element={<Cars />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/ad/:id" element={<AdDetails />} />
                <Route path="/password-reset" element={<PasswordReset />} />
                <Route path="/admin-login" element={<AdminLogin />} />
                <Route path="/admin-password-reset" element={<AdminPasswordReset />} />
                
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/add-ad"
                  element={
                    <ProtectedRoute>
                      <AddAd />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/messages"
                  element={
                    <ProtectedRoute>
                      <Messages />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <Notifications />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/boost-ad"
                  element={
                    <ProtectedRoute>
                      <BoostAd />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/seller-ads"
                  element={
                    <ProtectedRoute>
                      <SellerAds />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/upload-receipt"
                  element={
                    <ProtectedRoute>
                      <UploadReceipt />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/admin-dashboard"
                  element={
                    <AdminProtectedRoute>
                      <AdminDashboard />
                    </AdminProtectedRoute>
                  }
                />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AdminAuthProvider>
        </AuthProvider>
      </SecurityProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
