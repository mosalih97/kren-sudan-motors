
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Menu, 
  X, 
  Car, 
  Plus, 
  User, 
  LogOut, 
  MessageSquare, 
  Bell,
  Search,
  Shield
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUserPoints } from '@/hooks/useUserPoints';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { pointsData } = useUserPoints();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تسجيل الخروج",
        variant: "destructive"
      });
    }
  };

  const handleAuthClick = () => {
    if (user) {
      navigate('/profile');
    } else {
      navigate('/auth');
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 space-x-reverse">
            <Car className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-gray-900">الكرين</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4 space-x-reverse">
            <Link to="/cars" className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">
              السيارات
            </Link>
            <Link to="/search-results" className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2">
              <Search className="h-4 w-4" />
              البحث
            </Link>
            {user && (
              <Link to="/add-ad" className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2">
                <Plus className="h-4 w-4" />
                إضافة إعلان
              </Link>
            )}
          </nav>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4 space-x-reverse">
            {user ? (
              <>
                {/* Points Display */}
                {pointsData && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {pointsData.totalPoints} نقطة
                    </Badge>
                    {pointsData.membershipType === 'premium' && (
                      <Badge variant="default" className="bg-yellow-500 text-white">
                        مميز
                      </Badge>
                    )}
                  </div>
                )}

                {/* Admin Link */}
                {pointsData?.membershipType === 'admin' && (
                  <Link to="/admin" className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    لوحة التحكم
                  </Link>
                )}

                {/* Messages */}
                <Link to="/messages" className="text-gray-700 hover:text-primary p-2 rounded-md">
                  <MessageSquare className="h-5 w-5" />
                </Link>

                {/* Notifications */}
                <Link to="/notifications" className="text-gray-700 hover:text-primary p-2 rounded-md">
                  <Bell className="h-5 w-5" />
                </Link>

                {/* Profile */}
                <Link to="/profile" className="text-gray-700 hover:text-primary p-2 rounded-md">
                  <User className="h-5 w-5" />
                </Link>

                {/* Sign Out */}
                <Button onClick={handleSignOut} variant="outline" size="sm">
                  <LogOut className="h-4 w-4 ml-2" />
                  تسجيل الخروج
                </Button>
              </>
            ) : (
              <Button onClick={handleAuthClick} variant="default">
                <User className="h-4 w-4 ml-2" />
                تسجيل الدخول
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMenu}
              className="text-gray-700"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              <Link
                to="/cars"
                className="text-gray-700 hover:text-primary block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                السيارات
              </Link>
              <Link
                to="/search-results"
                className="text-gray-700 hover:text-primary block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                البحث
              </Link>
              {user && (
                <>
                  <Link
                    to="/add-ad"
                    className="text-gray-700 hover:text-primary block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    إضافة إعلان
                  </Link>
                  <Link
                    to="/profile"
                    className="text-gray-700 hover:text-primary block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    الملف الشخصي
                  </Link>
                  <Link
                    to="/messages"
                    className="text-gray-700 hover:text-primary block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    الرسائل
                  </Link>
                  <Link
                    to="/notifications"
                    className="text-gray-700 hover:text-primary block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    الإشعارات
                  </Link>
                  {pointsData?.membershipType === 'admin' && (
                    <Link
                      to="/admin"
                      className="text-gray-700 hover:text-primary block px-3 py-2 rounded-md text-base font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      لوحة التحكم
                    </Link>
                  )}
                  <Button
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    variant="outline"
                    className="w-full justify-start mt-2"
                  >
                    <LogOut className="h-4 w-4 ml-2" />
                    تسجيل الخروج
                  </Button>
                </>
              )}
              {!user && (
                <Button
                  onClick={() => {
                    handleAuthClick();
                    setIsMenuOpen(false);
                  }}
                  variant="default"
                  className="w-full justify-start mt-2"
                >
                  <User className="h-4 w-4 ml-2" />
                  تسجيل الدخول
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
