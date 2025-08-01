
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
      console.log('Checking session with token:', token ? 'exists' : 'none');
      
      if (!token) {
        console.log('No token found, user not authenticated');
        setIsAuthenticated(false);
        setSessionToken(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc('verify_admin_session', { token });
      
      console.log('Session verification response:', { data, error });
      
      if (error) {
        console.error('Session verification error:', error);
        localStorage.removeItem('admin_session_token');
        setIsAuthenticated(false);
        setSessionToken(null);
      } else if (data && typeof data === 'object' && 'valid' in data) {
        const result = data as { valid: boolean };
        if (result.valid) {
          console.log('Session is valid');
          setIsAuthenticated(true);
          setSessionToken(token);
        } else {
          console.log('Session is invalid');
          localStorage.removeItem('admin_session_token');
          setIsAuthenticated(false);
          setSessionToken(null);
        }
      } else {
        console.log('Invalid session data structure');
        localStorage.removeItem('admin_session_token');
        setIsAuthenticated(false);
        setSessionToken(null);
      }
    } catch (error) {
      console.error('Session check error:', error);
      localStorage.removeItem('admin_session_token');
      setIsAuthenticated(false);
      setSessionToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      console.log('Attempting login for username:', username);
      
      const { data, error } = await supabase.rpc('create_admin_session', {
        username_input: username,
        password_input: password,
        ip_addr: null,
        user_agent_input: navigator.userAgent
      });

      console.log('Login RPC response:', { data, error });

      if (error) {
        console.error('Login RPC error:', error);
        return { success: false, message: 'خطأ في الاتصال بالخادم' };
      }

      if (!data) {
        console.log('No data returned from login');
        return { success: false, message: 'خطأ في الخادم' };
      }

      // التعامل مع البيانات كـ JSON object
      let sessionData: any = data;
      
      // إذا كانت البيانات string، حاول تحويلها إلى JSON
      if (typeof data === 'string') {
        try {
          sessionData = JSON.parse(data);
        } catch (parseError) {
          console.error('Failed to parse session data:', parseError);
          return { success: false, message: 'خطأ في معالجة البيانات' };
        }
      }

      console.log('Processed session data:', sessionData);

      if (sessionData && sessionData.success && sessionData.session_token) {
        console.log('Login successful, storing token');
        localStorage.setItem('admin_session_token', sessionData.session_token);
        setSessionToken(sessionData.session_token);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        console.log('Login failed:', sessionData.message);
        return { 
          success: false, 
          message: sessionData.message || 'فشل تسجيل الدخول' 
        };
      }
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
