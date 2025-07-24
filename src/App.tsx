
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import AddAd from "./pages/AddAd";
import Cars from "./pages/Cars";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import AdDetails from "./pages/AdDetails";
import SellerAds from "./pages/SellerAds";
import UploadReceipt from "./pages/UploadReceipt";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/cars" element={<Cars />} />
              <Route path="/ads/:id" element={<AdDetails />} />
              <Route path="/seller/:id" element={<SellerAds />} />
              
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/add-ad" element={
                <ProtectedRoute>
                  <AddAd />
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
              
              {/* Redirect old boost routes */}
              <Route path="/boost-ad/:id" element={<Navigate to="/profile" replace />} />
              <Route path="/boost/:id" element={<Navigate to="/profile" replace />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
