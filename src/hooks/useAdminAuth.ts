
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AdminAuthState {
  isAuthenticated: boolean;
  loading: boolean;
  adminId: string | null;
}

export const useAdminAuth = () => {
  const [authState, setAuthState] = useState<AdminAuthState>({
    isAuthenticated: false,
    loading: true,
    adminId: null
  });

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = localStorage.getItem('admin_session_token');
      if (!token) {
        setAuthState({ isAuthenticated: false, loading: false, adminId: null });
        return;
      }

      const { data, error } = await supabase.rpc('verify_admin_session', { token });
      
      if (error || !data?.valid) {
        localStorage.removeItem('admin_session_token');
        setAuthState({ isAuthenticated: false, loading: false, adminId: null });
        return;
      }

      setAuthState({
        isAuthenticated: true,
        loading: false,
        adminId: data.admin_id
      });
    } catch (error) {
      console.error('Auth check error:', error);
      setAuthState({ isAuthenticated: false, loading: false, adminId: null });
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
        toast({
          title: "خطأ في تسجيل الدخول",
          description: data?.message || "حدث خطأ غير متوقع",
          variant: "destructive"
        });
        return false;
      }

      localStorage.setItem('admin_session_token', data.session_token);
      setAuthState({
        isAuthenticated: true,
        loading: false,
        adminId: data.admin_id
      });

      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحباً بك في لوحة التحكم"
      });

      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "خطأ في تسجيل الدخول",
        description: "حدث خطأ غير متوقع",
        variant: "destructive"
      });
      return false;
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('admin_session_token');
      if (token) {
        await supabase.rpc('logout_admin_session', { token });
      }
      localStorage.removeItem('admin_session_token');
      setAuthState({ isAuthenticated: false, loading: false, adminId: null });
      
      toast({
        title: "تم تسجيل الخروج",
        description: "تم تسجيل الخروج بنجاح"
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const logoutAll = async () => {
    try {
      if (authState.adminId) {
        await supabase.rpc('logout_all_admin_sessions', { admin_id: authState.adminId });
      }
      localStorage.removeItem('admin_session_token');
      setAuthState({ isAuthenticated: false, loading: false, adminId: null });
      
      toast({
        title: "تم تسجيل الخروج من جميع الجلسات",
        description: "تم تسجيل الخروج من جميع الأجهزة"
      });
    } catch (error) {
      console.error('Logout all error:', error);
    }
  };

  return {
    ...authState,
    login,
    logout,
    logoutAll,
    checkAuthState
  };
};
