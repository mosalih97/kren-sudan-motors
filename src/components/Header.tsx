import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Plus, User, Heart, MessageCircle, Crown, Menu, LogOut, Settings } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserPoints } from "@/hooks/useUserPoints";

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const { data: pointsData } = useUserPoints();

  useEffect(() => {
    if (user) {
      // Fetch user profile
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        setProfile(data);
      };

      // Fetch unread notifications count
      const fetchUnreadNotifications = async () => {
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false);
        setUnreadNotifications(count || 0);
      };

      // Fetch unread messages count
      const fetchUnreadMessages = async () => {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', user.id)
          .eq('is_read', false);
        setUnreadMessages(count || 0);
      };

      fetchProfile();
      fetchUnreadNotifications();
      fetchUnreadMessages();

      // Setup real-time subscription for messages
      const messagesSubscription = supabase
        .channel('header-messages')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id.eq.${user.id}`
          },
          () => {
            fetchUnreadMessages();
          }
        )
        .subscribe();

      return () => {
        messagesSubscription.unsubscribe();
      };
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const totalPoints = pointsData?.total_points || 0;
  const adsUsed = pointsData?.monthly_ads_count || 0;
  const adsLimit = pointsData?.monthly_ads_limit || 5;
  const remainingAds = adsLimit - adsUsed;

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 backdrop-blur-xl bg-background/80">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* الشعار */}
          <Link to="/" className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl primary-gradient flex items-center justify-center">
                <span className="text-white font-bold text-xl">ك</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold primary-gradient bg-clip-text text-transparent font-scheherazade">
                  الكرين
                </h1>
                <p className="text-xs text-muted-foreground">سوق السيارات السوداني</p>
              </div>
            </div>
          </Link>

          {/* القائمة الرئيسية - سطح المكتب */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/">
              <Button variant="ghost" className="text-foreground hover:text-primary">
                الرئيسية
              </Button>
            </Link>
            <Link to="/cars">
              <Button variant="ghost" className="text-foreground hover:text-primary">
                السيارات
              </Button>
            </Link>
            <Button variant="ghost" className="text-foreground hover:text-primary">
              المعارض
            </Button>
            <Button variant="ghost" className="text-foreground hover:text-primary">
              قطع الغيار
            </Button>
            <Button variant="ghost" className="text-foreground hover:text-primary">
              تمويل
            </Button>
          </nav>

          {/* أزرار التفاعل */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* النقاط ونوع العضوية */}
                <div className="hidden sm:flex items-center gap-2 bg-primary-light rounded-full px-3 py-2">
                  <Crown className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">
                    {totalPoints} نقطة
                  </span>
                  {profile?.membership_type === 'premium' && (
                    <Badge variant="outline" className="text-xs px-2 py-0">مميز</Badge>
                  )}
                </div>

                {/* الإشعارات */}
                <Link to="/notifications">
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadNotifications > 0 && (
                      <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
                        {unreadNotifications}
                      </Badge>
                    )}
                  </Button>
                </Link>

                {/* المفضلة */}
                <Button variant="ghost" size="icon" className="hidden sm:flex">
                  <Heart className="h-5 w-5" />
                </Button>

                {/* الرسائل */}
                <Link to="/messages">
                  <Button variant="ghost" size="icon" className="hidden sm:flex relative">
                    <MessageCircle className="h-5 w-5" />
                    {unreadMessages > 0 && (
                      <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs animate-pulse">
                        {unreadMessages}
                      </Badge>
                    )}
                  </Button>
                </Link>

                {/* إضافة إعلان */}
                <Link to="/add-ad">
                  <Button variant="accent" className="hidden sm:flex" disabled={remainingAds <= 0}>
                    <Plus className="h-4 w-4 ml-2" />
                    أضف إعلان ({remainingAds})
                  </Button>
                </Link>

                {/* الملف الشخصي */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full relative">
                      <User className="h-5 w-5" />
                      {profile?.membership_type === 'premium' && (
                        <Crown className="h-3 w-3 text-primary absolute -top-1 -right-1" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <div className="p-2">
                      <p className="text-sm font-medium">
                        {profile?.display_name || user.email}
                      </p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Crown className="h-4 w-4 text-primary" />
                        <span className="text-sm">{totalPoints} نقطة</span>
                        {profile?.membership_type === 'premium' && (
                          <Badge variant="outline" className="text-xs">مميز</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        إعلانات: {adsUsed}/{adsLimit} ({remainingAds} متبقي)
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    <Link to="/profile">
                      <DropdownMenuItem>
                        <Settings className="ml-2 h-4 w-4" />
                        الملف الشخصي
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="ml-2 h-4 w-4" />
                      تسجيل خروج
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="accent">
                  تسجيل دخول
                </Button>
              </Link>
            )}

            {/* قائمة الموبايل */}
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* شريط سريع للموبايل */}
        {user && (
          <div className="flex md:hidden items-center justify-center gap-2 mt-4">
            <Link to="/add-ad" className="flex-1">
              <Button variant="accent" size="sm" className="w-full" disabled={remainingAds <= 0}>
                <Plus className="h-4 w-4 ml-1" />
                أضف إعلان ({remainingAds})
              </Button>
            </Link>
            <Button variant="outline" size="sm">
              <Heart className="h-4 w-4" />
            </Button>
            <Link to="/messages">
              <Button variant="outline" size="sm" className="relative">
                <MessageCircle className="h-4 w-4" />
                {unreadMessages > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs animate-pulse">
                    {unreadMessages}
                  </Badge>
                )}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
