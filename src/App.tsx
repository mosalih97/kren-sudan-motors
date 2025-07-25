
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import AddAd from "./pages/AddAd";
import Cars from "./pages/Cars";
import SearchResults from "./pages/SearchResults";
import AdDetails from "./pages/AdDetails";
import SellerAds from "./pages/SellerAds";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import BoostAd from "./pages/BoostAd";
import UploadReceipt from "./pages/UploadReceipt";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/cars" element={<Cars />} />
            <Route path="/search-results" element={<SearchResults />} />
            <Route path="/ads/:id" element={<AdDetails />} />
            <Route path="/seller/:sellerId" element={<SellerAds />} />
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
              path="/boost-ad/:id" 
              element={
                <ProtectedRoute>
                  <BoostAd />
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
              path="/admin" 
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
