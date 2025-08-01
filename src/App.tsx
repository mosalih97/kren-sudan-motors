
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import { SecurityProvider } from "@/components/security/SecurityProvider";
import { SecurityAuditLogger } from "@/components/security/SecurityAuditLogger";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import Index from "./pages/Index";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

// Lazy load components for better performance
const Cars = lazy(() => import("./pages/Cars"));
const AddAd = lazy(() => import("./pages/AddAd"));
const AdDetails = lazy(() => import("./pages/AdDetails"));
const Profile = lazy(() => import("./pages/Profile"));
const Messages = lazy(() => import("./pages/Messages"));
const Notifications = lazy(() => import("./pages/Notifications"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const SellerAds = lazy(() => import("./pages/SellerAds"));
const Auth = lazy(() => import("./pages/Auth"));
const PasswordReset = lazy(() => import("./pages/PasswordReset"));
const UploadReceipt = lazy(() => import("./pages/UploadReceipt"));
const BoostAd = lazy(() => import("./pages/BoostAd"));

// Admin components
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <AdminAuthProvider>
              <SecurityProvider>
                <SecurityAuditLogger />
                <div className="min-h-screen bg-background">
                  <Suspense fallback={
                    <div className="flex items-center justify-center min-h-screen">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  }>
                    <Routes>
                      {/* Public routes */}
                      <Route path="/" element={<Index />} />
                      <Route path="/cars" element={<Cars />} />
                      <Route path="/search-results" element={<SearchResults />} />
                      <Route path="/ad/:id" element={<AdDetails />} />
                      <Route path="/ads/:id" element={<AdDetails />} />
                      <Route path="/seller-ads/:userId" element={<SellerAds />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/password-reset" element={<PasswordReset />} />
                      
                      {/* Admin routes */}
                      <Route path="/admin-login" element={<AdminLogin />} />
                      <Route path="/admin-dashboard" element={
                        <AdminProtectedRoute>
                          <AdminDashboard />
                        </AdminProtectedRoute>
                      } />
                      
                      {/* Protected routes */}
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
                      <Route path="/notifications" element={
                        <ProtectedRoute>
                          <Notifications />
                        </ProtectedRoute>
                      } />
                      <Route path="/upload-receipt" element={
                        <ProtectedRoute>
                          <UploadReceipt />
                        </ProtectedRoute>
                      } />
                      <Route path="/boost/:id" element={
                        <ProtectedRoute>
                          <BoostAd />
                        </ProtectedRoute>
                      } />
                    </Routes>
                  </Suspense>
                </div>
                <Toaster />
              </SecurityProvider>
            </AdminAuthProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
