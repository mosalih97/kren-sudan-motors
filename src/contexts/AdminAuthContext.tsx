
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
      console.log('Checking admin session, token exists:', !!token);
      
      if (!token) {
        console.log('No token found in localStorage');
        setLoading(false);
        return;
      }

      console.log('Calling verify_admin_session...');
      const { data, error } = await supabase.rpc('verify_admin_session', { 
        token: token 
      });

      console.log('verify_admin_session response:', { data, error });

      if (error || !data) {
        console.error('Error verifying session:', error);
        localStorage.removeItem('admin_session_token');
        setAdminUser(null);
      } else {
        const sessionData = data as unknown as VerifySessionResponse;
        console.log('Session data:', sessionData);
        
        if (!sessionData.valid) {
          console.log('Session not valid:', sessionData.message);
          localStorage.removeItem('admin_session_token');
          setAdminUser(null);
        } else {
          console.log('Session valid, setting admin user');
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
      console.log('Attempting login for username:', username);
      
      const { data, error } = await supabase.rpc('create_admin_session', {
        username_input: username,
        password_input: password,
        ip_addr: '',
        user_agent_input: navigator.userAgent
      });

      console.log('create_admin_session response:', { data, error });

      if (error) {
        console.error('Supabase RPC error:', error);
        return { 
          success: false, 
          error: `خطأ في الاتصال: ${error.message}` 
        };
      }

      if (!data) {
        console.error('No data returned from create_admin_session');
        return { 
          success: false, 
          error: 'لم يتم إرجاع بيانات من الخادم' 
        };
      }

      const sessionData = data as unknown as CreateSessionResponse;
      console.log('Session creation data:', sessionData);
      
      if (!sessionData.success) {
        console.error('Session creation failed:', sessionData.message);
        return { 
          success: false, 
          error: sessionData.message || 'فشل في إنشاء الجلسة' 
        };
      }

      if (sessionData.session_token) {
        console.log('Session token received, saving to localStorage');
        localStorage.setItem('admin_session_token', sessionData.session_token);
        await checkAdminSession();
        console.log('Login successful');
      } else {
        console.error('No session token in response');
        return { 
          success: false, 
          error: 'لم يتم إنشاء رمز الجلسة' 
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: `خطأ غير متوقع: ${error instanceof Error ? error.message : 'خطأ غير معروف'}` 
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
