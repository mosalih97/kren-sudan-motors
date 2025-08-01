
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSecurityLogger } from '@/hooks/useSecurityLogger';
import { sanitizeHtml } from '@/utils/securityValidation';

interface SecureApiOptions {
  requireAuth?: boolean;
  sanitizeInput?: boolean;
  logRequest?: boolean;
}

export const useSecureApi = () => {
  const { user } = useAuth();
  const { logSecurityEvent } = useSecurityLogger();

  const secureRequest = useCallback(async <T>(
    requestFn: () => Promise<T>,
    options: SecureApiOptions = {}
  ) => {
    const {
      requireAuth = true,
      sanitizeInput = true,
      logRequest = true
    } = options;

    try {
      // التحقق من المصادقة
      if (requireAuth && !user) {
        throw new Error('Authentication required');
      }

      // تسجيل الطلب
      if (logRequest) {
        logSecurityEvent('api_request', {
          timestamp: new Date().toISOString(),
          userId: user?.id,
          userAgent: navigator.userAgent
        });
      }

      // تنفيذ الطلب
      const result = await requestFn();

      // تسجيل النجاح
      if (logRequest) {
        logSecurityEvent('api_request_success', {
          timestamp: new Date().toISOString(),
          userId: user?.id
        });
      }

      return result;
    } catch (error) {
      // تسجيل الخطأ
      if (logRequest) {
        logSecurityEvent('api_request_error', {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
          userId: user?.id
        });
      }

      throw error;
    }
  }, [user, logSecurityEvent]);

  const secureQuery = useCallback(async (
    table: string,
    query: string,
    options: SecureApiOptions = {}
  ) => {
    return secureRequest(async () => {
      const { data, error } = await supabase
        .from(table as any)
        .select(query);

      if (error) throw error;
      return data;
    }, options);
  }, [secureRequest]);

  const secureInsert = useCallback(async (
    table: string,
    data: Record<string, any>,
    options: SecureApiOptions = {}
  ) => {
    return secureRequest(async () => {
      // تنظيف البيانات إذا كان مطلوباً
      let cleanData = data;
      if (options.sanitizeInput) {
        cleanData = Object.keys(data).reduce((acc, key) => {
          const value = data[key];
          if (typeof value === 'string') {
            acc[key] = sanitizeHtml(value);
          } else {
            acc[key] = value;
          }
          return acc;
        }, {} as Record<string, any>);
      }

      const { data: result, error } = await supabase
        .from(table as any)
        .insert(cleanData)
        .select();

      if (error) throw error;
      return result;
    }, options);
  }, [secureRequest]);

  const secureUpdate = useCallback(async (
    table: string,
    data: Record<string, any>,
    filter: Record<string, any>,
    options: SecureApiOptions = {}
  ) => {
    return secureRequest(async () => {
      // تنظيف البيانات إذا كان مطلوباً
      let cleanData = data;
      if (options.sanitizeInput) {
        cleanData = Object.keys(data).reduce((acc, key) => {
          const value = data[key];
          if (typeof value === 'string') {
            acc[key] = sanitizeHtml(value);
          } else {
            acc[key] = value;
          }
          return acc;
        }, {} as Record<string, any>);
      }

      let query = supabase.from(table as any).update(cleanData);
      
      // تطبيق المرشحات
      Object.keys(filter).forEach(key => {
        query = query.eq(key, filter[key]);
      });

      const { data: result, error } = await query.select();

      if (error) throw error;
      return result;
    }, options);
  }, [secureRequest]);

  return {
    secureRequest,
    secureQuery,
    secureInsert,
    secureUpdate
  };
};
