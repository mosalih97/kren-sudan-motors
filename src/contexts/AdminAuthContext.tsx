
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminUser {
  id: string;
  username: string;
}

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

// تعريف أنواع البيانات المُرجعة من دوال Supabase
interface VerifySessionResponse {
  valid: boolean;
  username?: string;
  admin_id?: string;
  message?: string;
}

interface CreateSessionResponse {
  success: boolean;
  session_token?: string;
  message?: string;
  expires_at?: string;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminSession();
  }, []);

  const checkAdminSession = async () => {
    try {
      const token = localStorage.getItem('admin_session_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc('verify_admin_session', { 
        token: token 
      });

      if (error || !data) {
        localStorage.removeItem('admin_session_token');
        setAdminUser(null);
      } else {
        const sessionData = data as unknown as VerifySessionResponse;
        if (!sessionData.valid) {
          localStorage.removeItem('admin_session_token');
          setAdminUser(null);
        } else {
          setAdminUser({
            id: sessionData.admin_id || '',
            username: sessionData.username || ''
          });
        }
      }
    } catch (error) {
      console.error('Error checking admin session:', error);
      localStorage.removeItem('admin_session_token');
      setAdminUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const { data, error } = await supabase.rpc('create_admin_session', {
        username_input: username,
        password_input: password,
        ip_addr: '',
        user_agent_input: navigator.userAgent
      });

      if (error || !data) {
        return { 
          success: false, 
          error: 'حدث خطأ في تسجيل الدخول' 
        };
      }

      const sessionData = data as unknown as CreateSessionResponse;
      
      if (!sessionData.success) {
        return { 
          success: false, 
          error: sessionData.message || 'حدث خطأ في تسجيل الدخول' 
        };
      }

      if (sessionData.session_token) {
        localStorage.setItem('admin_session_token', sessionData.session_token);
        await checkAdminSession();
      }

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: 'حدث خطأ غير متوقع' 
      };
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('admin_session_token');
      if (token && adminUser) {
        await supabase.rpc('logout_all_admin_sessions', {
          admin_id: adminUser.id
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('admin_session_token');
      setAdminUser(null);
    }
  };

  const value = {
    adminUser,
    loading,
    login,
    logout,
    isAuthenticated: !!adminUser
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
