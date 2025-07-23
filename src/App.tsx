
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Cars from "./pages/Cars";
import AdDetails from "./pages/AdDetails";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import AddAd from "./pages/AddAd";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import SellerAds from "./pages/SellerAds";
import BoostAd from "./pages/BoostAd";
import BankSubscription from "./pages/BankSubscription";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/cars" element={<Cars />} />
              <Route path="/ad/:id" element={<AdDetails />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/seller/:sellerId" element={<SellerAds />} />
              <Route path="/subscription" element={<BankSubscription />} />
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
              <Route path="/boost/:id" element={
                <ProtectedRoute>
                  <BoostAd />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
