
import React from 'react';
import './App.css';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SecurityProvider } from "./contexts/SecurityContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Cars from "./pages/Cars";
import AdDetails from "./pages/AdDetails";
import AddAd from "./pages/AddAd";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import SearchResults from "./pages/SearchResults";
import SellerAds from "./pages/SellerAds";
import UploadReceipt from "./pages/UploadReceipt";
import PasswordReset from "./pages/PasswordReset";
import BoostAd from "./pages/BoostAd";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";
import { AdminLayout } from "./components/admin/AdminLayout";
import { AdminProtectedRoute } from "./components/admin/AdminProtectedRoute";
import { AdminLogin } from "./pages/admin/AdminLogin";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminUsers } from "./pages/admin/AdminUsers";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <SecurityProvider>
          <BrowserRouter>
            <Routes>
              {/* مسارات التطبيق الرئيسي */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/cars" element={<Cars />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/ads/:id" element={<AdDetails />} />
              <Route path="/reset-password" element={<PasswordReset />} />
              
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
              <Route path="/boost/:id" element={
                <ProtectedRoute>
                  <BoostAd />
                </ProtectedRoute>
              } />
              <Route path="/notifications" element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              } />

              {/* مسارات الإدارة */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={
                <AdminProtectedRoute>
                  <AdminLayout />
                </AdminProtectedRoute>
              }>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="ads" element={<AdminDashboard />} />
                <Route path="reports" element={<AdminDashboard />} />
                <Route path="settings" element={<AdminDashboard />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </SecurityProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
