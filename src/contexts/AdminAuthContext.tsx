
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AdminAuthContextType {
  isAdminAuthenticated: boolean;
  adminLogin: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  adminLogout: () => Promise<void>;
  loading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    checkAdminSession();
  }, [user]);

  const checkAdminSession = async () => {
    try {
      const sessionToken = localStorage.getItem('admin_session_token');
      
      if (!sessionToken || !user) {
        setIsAdminAuthenticated(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc('verify_admin_session', {
        token_param: sessionToken
      });

      if (error) {
        console.error('Error verifying admin session:', error);
        localStorage.removeItem('admin_session_token');
        setIsAdminAuthenticated(false);
      } else if (data?.valid) {
        setIsAdminAuthenticated(true);
      } else {
        localStorage.removeItem('admin_session_token');
        setIsAdminAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking admin session:', error);
      setIsAdminAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const adminLogin = async (username: string, password: string) => {
    try {
      if (!user) {
        return { success: false, message: 'يجب تسجيل الدخول أولاً' };
      }

      const { data, error } = await supabase.rpc('admin_login', {
        username_param: username,
        password_param: password,
        ip_address_param: null,
        user_agent_param: navigator.userAgent
      });

      if (error) {
        console.error('Admin login error:', error);
        return { success: false, message: 'خطأ في النظام' };
      }

      if (data?.success) {
        localStorage.setItem('admin_session_token', data.session_token);
        setIsAdminAuthenticated(true);
        return { success: true, message: 'تم تسجيل الدخول بنجاح' };
      } else {
        return { success: false, message: data?.message || 'بيانات خاطئة' };
      }
    } catch (error) {
      console.error('Admin login error:', error);
      return { success: false, message: 'خطأ في النظام' };
    }
  };

  const adminLogout = async () => {
    try {
      const sessionToken = localStorage.getItem('admin_session_token');
      
      if (sessionToken) {
        await supabase.rpc('admin_logout', {
          token_param: sessionToken
        });
      }
      
      localStorage.removeItem('admin_session_token');
      setIsAdminAuthenticated(false);
    } catch (error) {
      console.error('Admin logout error:', error);
      localStorage.removeItem('admin_session_token');
      setIsAdminAuthenticated(false);
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        isAdminAuthenticated,
        adminLogin,
        adminLogout,
        loading
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};
