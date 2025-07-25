
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SecurityProvider } from "@/components/security/SecurityProvider";
import { SecurityAuditLogger } from "@/components/security/SecurityAuditLogger";
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
const NotFound = lazy(() => import("./pages/NotFound"));

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <SecurityProvider>
              <SecurityAuditLogger />
              <div className="min-h-screen bg-background">
                <Suspense fallback={
                  <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                }>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/cars" element={<Cars />} />
                    <Route path="/search" element={<SearchResults />} />
                    <Route path="/ad/:id" element={<AdDetails />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/password-reset" element={<PasswordReset />} />
                    
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
                    <Route path="/seller-ads" element={
                      <ProtectedRoute>
                        <SellerAds />
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
                    
                    {/* 404 route */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </div>
              <Toaster />
            </SecurityProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
