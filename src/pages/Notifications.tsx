import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { User, Session } from "@supabase/supabase-js";
import { Bell, Check, CheckCheck, Trash2, Filter, Settings } from "lucide-react";

const Notifications = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session?.user) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, filter]);

  const fetchNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (filter === "unread") {
        query = query.eq("is_read", false);
      } else if (filter === "read") {
        query = query.eq("is_read", true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast({
        title: "خطأ في التحميل",
        description: "حدث خطأ أثناء تحميل الإشعارات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) throw error;
      
      setNotifications(notifications.map(notif => 
        notif.id === notificationId 
          ? { ...notif, is_read: true }
          : notif
      ));
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث الإشعار",
        variant: "destructive"
      });
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;
      
      setNotifications(notifications.map(notif => ({ ...notif, is_read: true })));
      
      toast({
        title: "تم",
        description: "تم وضع علامة قراءة على جميع الإشعارات"
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث الإشعارات",
        variant: "destructive"
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message":
        return "💬";
      case "favorite":
        return "❤️";
      case "ad_update":
        return "🚗";
      case "system":
        return "⚙️";
      default:
        return "🔔";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "message":
        return "text-blue-500";
      case "favorite":
        return "text-red-500";
      case "ad_update":
        return "text-green-500";
      case "system":
        return "text-gray-500";
      default:
        return "text-blue-500";
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <Card className="card-gradient border-0 shadow-lg mb-6">
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className="w-10 h-10 rounded-lg primary-gradient flex items-center justify-center">
                      <Bell className="h-5 w-5 text-white" />
                    </div>
                    الإشعارات
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="ml-2">
                        {unreadCount}
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-muted-foreground mt-1">
                    تابع آخر التحديثات والرسائل
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button variant="outline" onClick={markAllAsRead} className="gap-2">
                      <CheckCheck className="h-4 w-4" />
                      وضع علامة قراءة على الكل
                    </Button>
                  )}
                  
                  <Button variant="ghost" className="gap-2">
                    <Settings className="h-4 w-4" />
                    إعدادات الإشعارات
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              الكل ({notifications.length})
            </Button>
            <Button
              variant={filter === "unread" ? "default" : "outline"}
              onClick={() => setFilter("unread")}
            >
              غير مقروءة ({unreadCount})
            </Button>
            <Button
              variant={filter === "read" ? "default" : "outline"}
              onClick={() => setFilter("read")}
            >
              مقروءة ({notifications.length - unreadCount})
            </Button>
          </div>

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <Card className="card-gradient border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-bold mb-2">
                  {filter === "all" ? "لا توجد إشعارات" : 
                   filter === "unread" ? "لا توجد إشعارات غير مقروءة" : 
                   "لا توجد إشعارات مقروءة"}
                </h3>
                <p className="text-muted-foreground">
                  {filter === "all" 
                    ? "ستظهر إشعاراتك هنا عند وصولها"
                    : "ستظهر الإشعارات المطابقة للفلتر المحدد هنا"
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`card-gradient border-0 shadow-sm hover:shadow-md transition-all cursor-pointer ${
                    !notification.is_read ? "ring-2 ring-primary/20 bg-primary/5" : ""
                  }`}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Notification Icon */}
                      <div className={`text-2xl ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Notification Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground mb-1">
                              {notification.title}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {notification.message}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(notification.created_at).toLocaleDateString("ar-SA", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                            
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-primary rounded-full" />
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 mt-3">
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="gap-1 text-xs h-7"
                            >
                              <Check className="h-3 w-3" />
                              وضع علامة قراءة
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-xs h-7 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                            حذف
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;