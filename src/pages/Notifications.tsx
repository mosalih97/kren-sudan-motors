
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { BackButton } from "@/components/BackButton";
import { NavigationArrows } from "@/components/NavigationArrows";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Check, Filter, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

const Notifications = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);

      if (error) throw error;

      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));

      toast({
        title: "تم وضع علامة كمقروءة",
        description: "تم تحديث حالة الإشعار"
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.is_read;
      case 'read':
        return notification.is_read;
      default:
        return true;
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <BackButton variant="floating" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="card-gradient border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-6 w-6" />
                الإشعارات
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filter Buttons */}
              <div className="flex gap-2 mb-6">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilter('all')}
                  className="gap-2"
                >
                  <Filter className="h-4 w-4" />
                  الكل ({notifications.length})
                </Button>
                <Button
                  variant={filter === 'unread' ? 'default' : 'outline'}
                  onClick={() => setFilter('unread')}
                  className="gap-2"
                >
                  غير مقروءة ({notifications.filter(n => !n.is_read).length})
                </Button>
                <Button
                  variant={filter === 'read' ? 'default' : 'outline'}
                  onClick={() => setFilter('read')}
                  className="gap-2"
                >
                  مقروءة ({notifications.filter(n => n.is_read).length})
                </Button>
              </div>

              {/* Notifications List */}
              {loading ? (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-pulse" />
                  <p className="text-muted-foreground">جاري تحميل الإشعارات...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-bold mb-2">لا توجد إشعارات</h3>
                  <p className="text-muted-foreground">
                    {filter === 'all' ? "لا توجد إشعارات حتى الآن" : 
                     filter === 'unread' ? "لا توجد إشعارات غير مقروءة" : 
                     "لا توجد إشعارات مقروءة"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredNotifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`border rounded-lg p-4 transition-colors ${
                        notification.is_read ? 'bg-muted/30' : 'bg-background border-primary/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{notification.title}</h4>
                            {!notification.is_read && (
                              <span className="w-2 h-2 bg-primary rounded-full"></span>
                            )}
                          </div>
                          <p className="text-muted-foreground mb-2">{notification.message}</p>
                          <span className="text-sm text-muted-foreground">
                            {new Date(notification.created_at).toLocaleDateString('ar-SA')}
                          </span>
                        </div>
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="gap-2"
                          >
                            <Check className="h-4 w-4" />
                            تم القراءة
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <NavigationArrows
        prevPage={{
          url: "/messages",
          title: "المحادثات"
        }}
        nextPage={{
          url: "/profile",
          title: "الملف الشخصي"
        }}
      />
    </div>
  );
};

export default Notifications;
