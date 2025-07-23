
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Index from './pages/Index';
import AdDetails from './pages/AdDetails';
import Profile from './pages/Profile';
import Auth from './pages/Auth';
import AddAd from './pages/AddAd';
import BoostAd from './pages/BoostAd';
import Header from './components/Header';
import { Toaster } from "@/components/ui/toaster"
import BankSubscription from './pages/BankSubscription';

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/auth" />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <div className="min-h-screen bg-background">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/ad/:id" element={<AdDetails />} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/ads/new" element={<ProtectedRoute><AddAd /></ProtectedRoute>} />
                <Route path="/boost-ad/:id" element={<ProtectedRoute><BoostAd /></ProtectedRoute>} />
                <Route path="/bank-subscription" element={<ProtectedRoute><BankSubscription /></ProtectedRoute>} />
              </Routes>
            </main>
            <Toaster />
          </div>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
