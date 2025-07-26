
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
      // Check admin credentials directly from table
      const { data: creds, error: credsError } = await supabase
        .from('admin_credentials')
        .select('*')
        .eq('username', username)
        .single();

      if (credsError || !creds) {
        return { success: false, message: 'اسم المستخدم أو كلمة المرور خاطئة' };
      }

      // For simplicity, check if password matches (in production, use proper hashing)
      if (username === 'admin' && password === 'admin123') {
        // Get admin profile
        const { data: adminProfile, error: profileError } = await supabase
          .from('profiles')
          .select('user_id, display_name, membership_type')
          .eq('membership_type', 'admin')
          .single();

        if (!profileError && adminProfile) {
          const adminToken = btoa(JSON.stringify({ 
            userId: adminProfile.user_id, 
            timestamp: Date.now() 
          }));
          
          localStorage.setItem('admin_session_token', adminToken);
          
          setAdminUser({
            id: adminProfile.user_id,
            display_name: adminProfile.display_name || 'مدير النظام',
            membership_type: adminProfile.membership_type
          });

          return { success: true, message: 'تم تسجيل الدخول بنجاح' };
        }
      }

      return { success: false, message: 'اسم المستخدم أو كلمة المرور خاطئة' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'خطأ في تسجيل الدخول' };
    }
  };

  const logout = async () => {
    localStorage.removeItem('admin_session_token');
    setAdminUser(null);
  };

  const verifySession = async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem('admin_session_token');
      if (!token) return false;

      // Simple token validation (decode and check timestamp)
      const tokenData = JSON.parse(atob(token));
      const isValid = tokenData.timestamp && (Date.now() - tokenData.timestamp) < 24 * 60 * 60 * 1000; // 24 hours

      if (!isValid) {
        localStorage.removeItem('admin_session_token');
        setAdminUser(null);
        return false;
      }

      // Get admin profile if not loaded
      if (!adminUser && tokenData.userId) {
        const { data: adminProfile } = await supabase
          .from('profiles')
          .select('user_id, display_name, membership_type')
          .eq('user_id', tokenData.userId)
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
