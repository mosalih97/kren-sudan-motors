
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

      // Direct table query for faster response
      const { data, error } = await supabase
        .from('admin_sessions')
        .select('*')
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error) {
        console.error('Error verifying admin session:', error);
        localStorage.removeItem('admin_session_token');
        setIsAdminAuthenticated(false);
      } else if (data) {
        // Verify user is admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('membership_type')
          .eq('user_id', user.id)
          .eq('membership_type', 'admin')
          .maybeSingle();

        if (profile) {
          setIsAdminAuthenticated(true);
          // Extend session
          await supabase
            .from('admin_sessions')
            .update({ expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() })
            .eq('session_token', sessionToken);
        } else {
          localStorage.removeItem('admin_session_token');
          setIsAdminAuthenticated(false);
        }
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

      // Check if user has admin role first
      const { data: profile } = await supabase
        .from('profiles')
        .select('membership_type')
        .eq('user_id', user.id)
        .eq('membership_type', 'admin')
        .maybeSingle();

      if (!profile) {
        return { success: false, message: 'ليس لديك صلاحيات إدارية' };
      }

      // Get admin credentials
      const { data: credentials } = await supabase
        .from('admin_credentials')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (!credentials) {
        return { success: false, message: 'بيانات دخول خاطئة' };
      }

      // For now, we'll do a simple password check (in production, use proper hashing)
      if (username === 'admin' && password === 'admin123') {
        // Generate session token
        const sessionToken = crypto.getRandomValues(new Uint32Array(4)).join('');
        
        // Invalidate old sessions
        await supabase
          .from('admin_sessions')
          .update({ is_active: false })
          .eq('admin_user_id', user.id);

        // Create new session
        const { error: sessionError } = await supabase
          .from('admin_sessions')
          .insert({
            admin_user_id: user.id,
            session_token: sessionToken,
            ip_address: 'unknown',
            user_agent: navigator.userAgent,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          });

        if (sessionError) {
          console.error('Session creation error:', sessionError);
          return { success: false, message: 'خطأ في النظام' };
        }

        localStorage.setItem('admin_session_token', sessionToken);
        setIsAdminAuthenticated(true);
        return { success: true, message: 'تم تسجيل الدخول بنجاح' };
      } else {
        return { success: false, message: 'بيانات دخول خاطئة' };
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
        await supabase
          .from('admin_sessions')
          .update({ is_active: false })
          .eq('session_token', sessionToken);
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
