import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useLocation } from "react-router-dom";
import { User, Search, Menu, X, Car, Plus, MessageCircle, Bell, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { UserPointsDisplay } from "@/components/UserPointsDisplay";

interface Profile {
  display_name: string | null;
  avatar_url: string | null;
}

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("user_id", user?.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim() !== "") {
      navigate(`/?search=${searchQuery}`);
    } else {
      navigate("/");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Car className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">سوق السيارات</span>
        </div>

        {/* Search Bar - Desktop */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث عن سيارة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/add-ad")}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                إضافة إعلان
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/messages")}
                className="gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                الرسائل
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/notifications")}
                className="gap-2"
              >
                <Bell className="h-4 w-4" />
                الإشعارات
              </Button>

              {/* User Menu */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="gap-2"
                >
                  <User className="h-4 w-4" />
                  {profile?.display_name || "حسابي"}
                </Button>
                
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-background border rounded-lg shadow-lg p-4 z-50">
                    <div className="space-y-3">
                      <div className="border-b pb-3">
                        <p className="font-medium">{profile?.display_name || "مستخدم"}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      
                      {/* عرض النقاط في القائمة الجانبية */}
                      <UserPointsDisplay variant="sidebar" />
                      
                      <div className="space-y-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigate("/profile");
                            setUserMenuOpen(false);
                          }}
                          className="w-full justify-start gap-2"
                        >
                          <Settings className="h-4 w-4" />
                          الملف الشخصي
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            signOut();
                            setUserMenuOpen(false);
                          }}
                          className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                        >
                          <LogOut className="h-4 w-4" />
                          تسجيل الخروج
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Button onClick={() => navigate("/auth")}>تسجيل الدخول</Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-background p-4">
          <div className="space-y-4">
            {/* Mobile Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث عن سيارة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>

            {user ? (
              <div className="space-y-3">
                <div className="border-b pb-3">
                  <p className="font-medium">{profile?.display_name || "مستخدم"}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                
                {/* عرض النقاط في القائمة المحمولة */}
                <UserPointsDisplay variant="sidebar" />
                
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigate("/add-ad");
                      setIsMenuOpen(false);
                    }}
                    className="w-full justify-start gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    إضافة إعلان
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigate("/messages");
                      setIsMenuOpen(false);
                    }}
                    className="w-full justify-start gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    الرسائل
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigate("/notifications");
                      setIsMenuOpen(false);
                    }}
                    className="w-full justify-start gap-2"
                  >
                    <Bell className="h-4 w-4" />
                    الإشعارات
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigate("/profile");
                      setIsMenuOpen(false);
                    }}
                    className="w-full justify-start gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    الملف الشخصي
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      signOut();
                      setIsMenuOpen(false);
                    }}
                    className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    تسجيل الخروج
                  </Button>
                </div>
              </div>
            ) : (
              <Button 
                onClick={() => {
                  navigate("/auth");
                  setIsMenuOpen(false);
                }}
                className="w-full"
              >
                تسجيل الدخول
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
