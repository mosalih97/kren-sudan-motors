import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient } from 'react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Home from './pages/Home';
import AdDetails from './pages/AdDetails';
import Profile from './pages/Profile';
import Auth from './pages/Auth';
import PostAd from './pages/PostAd';
import EditAd from './pages/EditAd';
import Header from './components/Header';
import { Toaster } from "@/components/ui/toaster"

import BankSubscription from './pages/BankSubscription';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/auth" />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <QueryClient>
      <BrowserRouter>
        <AuthProvider>
          <div className="min-h-screen bg-background">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/ad/:id" element={<AdDetails />} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/post-ad" element={<ProtectedRoute><PostAd /></ProtectedRoute>} />
                <Route path="/edit-ad/:id" element={<ProtectedRoute><EditAd /></ProtectedRoute>} />
                <Route path="/bank-subscription" element={<ProtectedRoute><BankSubscription /></ProtectedRoute>} />
              </Routes>
            </main>
            <Toaster />
          </div>
        </AuthProvider>
      </BrowserRouter>
    </QueryClient>
  );
}

export default App;
