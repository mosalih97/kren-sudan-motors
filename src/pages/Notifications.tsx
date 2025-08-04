
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { BackButton } from '@/components/BackButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, Trash2, Info, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "خطأ في جلب الإشعارات",
        description: "حدث خطأ أثناء جلب الإشعارات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      );

      toast({
        title: "تم تحديث الإشعارات",
        description: "تم تمييز جميع الإشعارات كمقروءة"
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث الإشعارات",
        variant: "destructive"
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const unreadCount = notifications.filter(notif => !notif.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <BackButton />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <BackButton />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Bell className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold">الإشعارات</h1>
              {unreadCount > 0 && (
                <Badge variant="destructive">
                  {unreadCount} جديد
                </Badge>
              )}
            </div>
            
            {unreadCount > 0 && (
              <Button variant="outline" onClick={markAllAsRead}>
                <Check className="h-4 w-4 ml-2" />
                تمييز الكل كمقروء
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {notifications.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-bold mb-2">لا توجد إشعارات</h3>
                  <p className="text-muted-foreground">
                    ستظهر إشعاراتك هنا عند وصولها
                  </p>
                </CardContent>
              </Card>
            ) : (
              notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`transition-all ${
                    !notification.is_read 
                      ? 'border-primary/50 bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getNotificationIcon(notification.type)}
                        <div>
                          <CardTitle className="text-base">{notification.title}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                              locale: ar
                            })}
                            {!notification.is_read && (
                              <Badge variant="outline" className="text-xs">
                                جديد
                              </Badge>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                      
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    
                    {notification.data && (
                      <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                        <pre className="text-xs text-muted-foreground overflow-x-auto">
                          {JSON.stringify(notification.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                إجمالي الإشعارات: {notifications.length} | 
                غير مقروءة: {unreadCount}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
