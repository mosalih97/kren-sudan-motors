
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Bell, User, Settings, LogOut, Plus, Car, MessageSquare, Crown, Shield } from 'lucide-react';

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // جلب بيانات الملف الشخصي
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // التحقق من صلاحيات الإدارة
  const { data: isAdmin } = useQuery({
    queryKey: ['admin-check', user?.email],
    queryFn: async () => {
      if (!user?.email) return false;
      
      const { data, error } = await supabase.rpc('is_admin', {
        user_email: user.email
      });

      if (error) {
        console.error('Admin check error:', error);
        return false;
      }
      
      return data;
    },
    enabled: !!user?.email,
  });

  // جلب عدد الإشعارات غير المقروءة
  const { data: unreadCount } = useQuery({
    queryKey: ['unread-notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <header className="bg-white shadow-md border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Car className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-blue-600">الكرين</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              to="/cars" 
              className="text-gray-700 hover:text-blue-600 font-medium"
            >
              السيارات
            </Link>
            {user && (
              <>
                <Link 
                  to="/add-ad" 
                  className="text-gray-700 hover:text-blue-600 font-medium"
                >
                  إضافة إعلان
                </Link>
                <Link 
                  to="/my-ads" 
                  className="text-gray-700 hover:text-blue-600 font-medium"
                >
                  إعلاناتي
                </Link>
              </>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                {/* الإشعارات */}
                <Link to="/notifications" className="relative p-2">
                  <Bell className="h-5 w-5 text-gray-600 hover:text-blue-600" />
                  {unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </Link>

                {/* الرسائل */}
                <Link to="/messages" className="p-2">
                  <MessageSquare className="h-5 w-5 text-gray-600 hover:text-blue-600" />
                </Link>

                {/* قائمة المستخدم */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile?.avatar_url} alt="الملف الشخصي" />
                        <AvatarFallback>
                          {profile?.display_name?.charAt(0) || user.email?.charAt(0) || '؟'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium text-sm">
                          {profile?.display_name || 'مستخدم'}
                        </p>
                        <p className="w-[200px] truncate text-xs text-muted-foreground">
                          {user.email}
                        </p>
                        <div className="flex items-center gap-2">
                          {profile?.is_premium && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                              <Crown className="h-3 w-3 mr-1" />
                              مميز
                            </Badge>
                          )}
                          {isAdmin && (
                            <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              مدير
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    
                    {/* لوحة التحكم الإدارية */}
                    {isAdmin && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/admin" className="cursor-pointer">
                            <Shield className="mr-2 h-4 w-4" />
                            <span>لوحة التحكم</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>الملف الشخصي</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link to="/add-ad" className="cursor-pointer">
                        <Plus className="mr-2 h-4 w-4" />
                        <span>إضافة إعلان</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="cursor-pointer text-red-600"
                      onClick={handleSignOut}
                      disabled={isLoading}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{isLoading ? 'جاري الخروج...' : 'تسجيل الخروج'}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button asChild>
                <Link to="/auth">تسجيل الدخول</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
