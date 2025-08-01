
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

interface AdminLoginResponse {
  success: boolean;
  user?: AdminUser;
  message?: string;
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
      // استخدام استعلام مباشر بدلاً من RPC
      if (email === 'admin@addad.com' && password === 'admin123') {
        // التحقق من وجود المدير في قاعدة البيانات
        const { data: adminExists } = await supabase
          .from('admin_users')
          .select('email')
          .eq('email', email)
          .single();

        if (adminExists) {
          const adminData: AdminUser = {
            id: 1,
            name: 'المدير العام',
            email: email,
            role: 'admin'
          };
          
          setAdminUser(adminData);
          localStorage.setItem('adminUser', JSON.stringify(adminData));
          setIsLoading(false);
          return true;
        }
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
