
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SecurityProvider } from "@/contexts/SecurityContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { AdminRoute } from "./components/admin/AdminRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Cars from "./pages/Cars";
import AddAd from "./pages/AddAd";
import AdDetails from "./pages/AdDetails";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import SearchResults from "./pages/SearchResults";
import BoostAd from "./pages/BoostAd";
import SellerAds from "./pages/SellerAds";
import PasswordReset from "./pages/PasswordReset";
import UploadReceipt from "./pages/UploadReceipt";
import Notifications from "./pages/Notifications";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SecurityProvider>
          <TooltipProvider>
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
                
                {/* المسارات المحمية */}
                <Route path="/add-ad" element={
                  <ProtectedRoute>
                    <AddAd />
                  </ProtectedRoute>
                } />
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
                <Route path="/boost/:id" element={
                  <ProtectedRoute>
                    <BoostAd />
                  </ProtectedRoute>
                } />
                <Route path="/my-ads" element={
                  <ProtectedRoute>
                    <SellerAds />
                  </ProtectedRoute>
                } />
                <Route path="/upload-receipt" element={
                  <ProtectedRoute>
                    <UploadReceipt />
                  </ProtectedRoute>
                } />
                <Route path="/notifications" element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                } />
                
                {/* مسار لوحة التحكم الإدارية */}
                <Route path="/admin" element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </SecurityProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
