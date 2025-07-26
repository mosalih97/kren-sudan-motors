
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminUser {
  id: string;
  display_name: string;
  membership_type: string;
}

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  verifySession: () => Promise<boolean>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
};

interface AdminAuthProviderProps {
  children: ReactNode;
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = async (username: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const { data, error } = await supabase.rpc('create_admin_session', {
        username_input: username,
        password_input: password,
        ip_addr: null,
        user_agent_input: navigator.userAgent
      });

      if (error) {
        console.error('Login error:', error);
        return { success: false, message: 'خطأ في تسجيل الدخول' };
      }

      if (data?.success) {
        localStorage.setItem('admin_session_token', data.session_token);
        
        // جلب بيانات المدير
        const { data: adminProfile, error: profileError } = await supabase
          .from('profiles')
          .select('user_id, display_name, membership_type')
          .eq('user_id', data.admin_id)
          .eq('membership_type', 'admin')
          .single();

        if (!profileError && adminProfile) {
          setAdminUser({
            id: adminProfile.user_id,
            display_name: adminProfile.display_name || 'مدير النظام',
            membership_type: adminProfile.membership_type
          });
        }

        return { success: true, message: 'تم تسجيل الدخول بنجاح' };
      } else {
        return { success: false, message: data?.message || 'خطأ في تسجيل الدخول' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'خطأ في تسجيل الدخول' };
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('admin_session_token');
      if (token) {
        await supabase.rpc('logout_admin_session', { token });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('admin_session_token');
      setAdminUser(null);
    }
  };

  const verifySession = async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem('admin_session_token');
      if (!token) return false;

      const { data, error } = await supabase.rpc('verify_admin_session', { token });
      
      if (error || !data?.valid) {
        localStorage.removeItem('admin_session_token');
        setAdminUser(null);
        return false;
      }

      // جلب بيانات المدير إذا لم تكن محملة
      if (!adminUser && data.admin_id) {
        const { data: adminProfile } = await supabase
          .from('profiles')
          .select('user_id, display_name, membership_type')
          .eq('user_id', data.admin_id)
          .eq('membership_type', 'admin')
          .single();

        if (adminProfile) {
          setAdminUser({
            id: adminProfile.user_id,
            display_name: adminProfile.display_name || 'مدير النظام',
            membership_type: adminProfile.membership_type
          });
        }
      }

      return true;
    } catch (error) {
      console.error('Session verification error:', error);
      return false;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      await verifySession();
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  return (
    <AdminAuthContext.Provider value={{
      adminUser,
      isLoading,
      login,
      logout,
      verifySession
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};
