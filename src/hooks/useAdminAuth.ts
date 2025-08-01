
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'admin';
}

interface UseAdminAuthReturn {
  adminUser: AdminUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

export const useAdminAuth = (): UseAdminAuthReturn => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // فحص الجلسة المحفوظة
    const savedAdmin = localStorage.getItem('adminUser');
    if (savedAdmin) {
      try {
        setAdminUser(JSON.parse(savedAdmin));
      } catch (error) {
        localStorage.removeItem('adminUser');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // استخدام الدالة المحدثة من قاعدة البيانات
      const { data, error } = await supabase.rpc('admin_login', {
        email_param: email,
        password_param: password
      });

      if (error) {
        console.error('Login error:', error);
        setIsLoading(false);
        return false;
      }

      if (data && data.success) {
        const adminData: AdminUser = data.user;
        setAdminUser(adminData);
        localStorage.setItem('adminUser', JSON.stringify(adminData));
        setIsLoading(false);
        return true;
      }

      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setAdminUser(null);
    localStorage.removeItem('adminUser');
  };

  return { adminUser, login, logout, isLoading };
};
