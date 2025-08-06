import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { SecurityProvider } from "@/contexts/SecurityContext";
import { Header } from "@/components/Header";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import PasswordReset from "@/pages/PasswordReset";
import Cars from "@/pages/Cars";
import SearchResults from "@/pages/SearchResults";
import AdDetails from "@/pages/AdDetails";
import SellerAds from "@/pages/SellerAds";
import AddAd from "@/pages/AddAd";
import Profile from "@/pages/Profile";
import Messages from "@/pages/Messages";
import Notifications from "@/pages/Notifications";
import BoostAd from "@/pages/BoostAd";
import UploadReceipt from "@/pages/UploadReceipt";
import AdminDashboard from "@/pages/AdminDashboard";
import ProtectedRoute from "@/components/ProtectedRoute";
import NotFound from "@/pages/NotFound";
import "./App.css";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import AdminProtectedRoute from "@/components/admin/AdminProtectedRoute";
import AdminLogin from "@/pages/AdminLogin";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AdminAuthProvider>
          <SecurityProvider>
            <Router>
              <div className="min-h-screen bg-background">
                <Header />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/password-reset" element={<PasswordReset />} />
                  <Route path="/cars" element={<Cars />} />
                  <Route path="/search-results" element={<SearchResults />} />
                  <Route path="/ads/:id" element={<AdDetails />} />
                  <Route path="/seller/:userId" element={<SellerAds />} />
                  <Route path="/add-ad" element={<ProtectedRoute><AddAd /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                  <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                  <Route path="/boost/:id" element={<ProtectedRoute><BoostAd /></ProtectedRoute>} />
                  <Route path="/upload-receipt" element={<ProtectedRoute><UploadReceipt /></ProtectedRoute>} />
                  <Route path="/admin-login" element={<AdminLogin />} />
                  <Route path="/admin-dashboard" element={
                    <AdminProtectedRoute>
                      <AdminDashboard />
                    </AdminProtectedRoute>
                  } />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
              <Toaster />
            </Router>
          </SecurityProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
