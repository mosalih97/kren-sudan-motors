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
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  isAuthenticated: boolean;
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

      if (error) {
        console.error('Error verifying session:', error);
        localStorage.removeItem('admin_session_token');
        setAdminUser(null);
      } else if (data && typeof data === 'object' && data !== null) {
        console.log('Session data:', data);
        
        const sessionData = data as any;
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
      } else {
        console.log('No data returned from verify_admin_session');
        localStorage.removeItem('admin_session_token');
        setAdminUser(null);
      }
    } catch (error) {
      console.error('Unexpected error checking admin session:', error);
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
        user_agent_input: navigator.userAgent || ''
      });

      console.log('create_admin_session response:', { data, error });

      if (error) {
        console.error('Supabase RPC error:', error);
        return { 
          success: false, 
          error: `خطأ في الاتصال: ${error.message}` 
        };
      }

      if (!data || typeof data !== 'object' || data === null) {
        console.error('No data returned from create_admin_session');
        return { 
          success: false, 
          error: 'لم يتم إرجاع بيانات من الخادم' 
        };
      }

      const sessionData = data as any;
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
        return { success: true };
      } else {
        console.error('No session token in response');
        return { 
          success: false, 
          error: 'لم يتم إنشاء رمز الجلسة' 
        };
      }
    } catch (error) {
      console.error('Unexpected login error:', error);
      return { 
        success: false, 
        error: `خطأ غير متوقع: ${error instanceof Error ? error.message : 'خطأ غير معروف'}` 
      };
    }
  };

  const changePassword = async (newPassword: string) => {
    try {
      if (!adminUser) {
        return { success: false, error: 'يجب تسجيل الدخول أولاً' };
      }

      console.log('Attempting to change password for admin:', adminUser.id);

      // استخدام الدالة المنشأة في قاعدة البيانات
      const { data, error } = await supabase.rpc('change_admin_password', {
        admin_id: adminUser.id,
        new_password: newPassword
      });

      if (error) {
        console.error('Password change error:', error);
        return { 
          success: false, 
          error: `خطأ في تغيير كلمة المرور: ${error.message}` 
        };
      }

      if (data && typeof data === 'object' && data !== null) {
        const result = data as any;
        if (result.success) {
          console.log('Password changed successfully');
          return { success: true };
        } else {
          return { 
            success: false, 
            error: result.message || 'فشل في تغيير كلمة المرور' 
          };
        }
      }

      return { success: false, error: 'استجابة غير متوقعة من الخادم' };
    } catch (error) {
      console.error('Unexpected password change error:', error);
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
        console.log('Logging out admin user:', adminUser.id);
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
    changePassword,
    isAuthenticated: !!adminUser
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
