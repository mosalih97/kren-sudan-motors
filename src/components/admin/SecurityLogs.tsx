
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

export const SecurityLogs = () => {
  const { data: securityLogs, isLoading } = useQuery({
    queryKey: ['security-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            سجلات الأمان
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('login') || eventType.includes('auth')) {
      return Activity;
    }
    if (eventType.includes('suspicious') || eventType.includes('error')) {
      return AlertTriangle;
    }
    return Shield;
  };

  const getEventColor = (eventType: string) => {
    if (eventType.includes('suspicious') || eventType.includes('error')) {
      return 'text-red-600 bg-red-100';
    }
    if (eventType.includes('login')) {
      return 'text-green-600 bg-green-100';
    }
    return 'text-blue-600 bg-blue-100';
  };

  const getEventLabel = (eventType: string) => {
    const eventLabels: { [key: string]: string } = {
      'user_login': 'تسجيل دخول',
      'user_logout': 'تسجيل خروج',
      'login_failed': 'فشل تسجيل الدخول',
      'signup_successful': 'إنشاء حساب',
      'suspicious_activity': 'نشاط مشبوه',
      'api_request': 'طلب API',
      'console_error': 'خطأ في وحدة التحكم',
    };
    return eventLabels[eventType] || eventType;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          سجلات الأمان
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {securityLogs?.map((log) => {
            const EventIcon = getEventIcon(log.event_type);
            const colorClass = getEventColor(log.event_type);
            
            return (
              <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`p-2 rounded-full ${colorClass}`}>
                  <EventIcon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">
                      {getEventLabel(log.event_type)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {log.event_type}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">
                    {formatDistanceToNow(new Date(log.created_at), {
                      addSuffix: true,
                      locale: ar,
                    })}
                  </p>
                  {log.event_data && (
                    <div className="text-xs text-gray-500 bg-white p-2 rounded border">
                      <pre className="whitespace-pre-wrap break-all">
                        {JSON.stringify(log.event_data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {securityLogs?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد سجلات أمان حتى الآن</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
