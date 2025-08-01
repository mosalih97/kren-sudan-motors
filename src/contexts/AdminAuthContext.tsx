
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminAuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  sessionToken: string | null;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const token = localStorage.getItem('admin_session_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc('verify_admin_session', { token });
      
      if (error || !data?.valid) {
        localStorage.removeItem('admin_session_token');
        setIsAuthenticated(false);
        setSessionToken(null);
      } else {
        setIsAuthenticated(true);
        setSessionToken(token);
      }
    } catch (error) {
      console.error('Session verification error:', error);
      localStorage.removeItem('admin_session_token');
      setIsAuthenticated(false);
      setSessionToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const { data, error } = await supabase.rpc('create_admin_session', {
        username_input: username,
        password_input: password,
        ip_addr: null,
        user_agent_input: navigator.userAgent
      });

      if (error || !data?.success) {
        return { success: false, message: data?.message || 'فشل تسجيل الدخول' };
      }

      localStorage.setItem('admin_session_token', data.session_token);
      setSessionToken(data.session_token);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'خطأ في الاتصال' };
    }
  };

  const logout = async () => {
    try {
      if (sessionToken) {
        await supabase.rpc('logout_admin_session', { token: sessionToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('admin_session_token');
      setIsAuthenticated(false);
      setSessionToken(null);
    }
  };

  return (
    <AdminAuthContext.Provider value={{
      isAuthenticated,
      loading,
      login,
      logout,
      sessionToken
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
