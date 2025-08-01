
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useAdminAccess = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        setError(null);
        
        // التحقق من صلاحيات المدير باستخدام الفانكشن المحدث
        const { data, error: rpcError } = await supabase.rpc('is_admin_user_by_id', {
          user_id_param: user.id
        });

        if (rpcError) {
          console.error('Admin check error:', rpcError);
          setError('حدث خطأ في التحقق من الصلاحيات');
          setIsAdmin(false);
        } else {
          setIsAdmin(data || false);
        }
      } catch (err) {
        console.error('Admin access check failed:', err);
        setError('فشل في التحقق من صلاحيات المدير');
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      checkAdminAccess();
    }
  }, [user, authLoading]);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      const { data, error: rpcError } = await supabase.rpc('is_admin_user_by_id', {
        user_id_param: user.id
      });

      if (rpcError) {
        console.error('Admin refetch error:', rpcError);
        setError('حدث خطأ في التحقق من الصلاحيات');
        setIsAdmin(false);
      } else {
        setIsAdmin(data || false);
      }
    } catch (err) {
      console.error('Admin refetch failed:', err);
      setError('فشل في التحقق من صلاحيات المدير');
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  return { 
    isAdmin, 
    loading: loading || authLoading, 
    error,
    refetch 
  };
};
