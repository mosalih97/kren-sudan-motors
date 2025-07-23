
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { CreditCard, Plus, Settings, User, UserPlus, Menu, X } from 'lucide-react';

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-gray-800 hover:text-blue-600 transition-colors">
            Al Kreen
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/cars" className="text-gray-600 hover:text-blue-600 transition-colors">
              تصفح السيارات
            </Link>
            <Link to="/ads/new" className="text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-2">
              <Plus className="h-4 w-4" />
              أضف إعلانك
            </Link>
            {user && (
              <Link
                to="/bank-subscription"
                className="text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                تفعيل الاشتراك البنكي
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm" onClick={toggleMenu}>
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.user_metadata?.avatar_url || ""} alt={user?.user_metadata?.name || "User Avatar"} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.user_metadata?.name || "المستخدم"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>الملف الشخصي</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/notifications')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>الإشعارات</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/messages')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>الرسائل</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={async () => {
                    await signOut();
                    navigate('/auth');
                  }}
                    className="cursor-pointer text-red-600">
                    تسجيل الخروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/auth" className="text-gray-600 hover:text-blue-600 transition-colors">
                  تسجيل الدخول
                </Link>
                <Link to="/auth" className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors">
                  إنشاء حساب
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-4">
              <Link 
                to="/cars" 
                className="text-gray-600 hover:text-blue-600 transition-colors py-2"
                onClick={closeMenu}
              >
                تصفح السيارات
              </Link>
              <Link 
                to="/ads/new" 
                className="text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-2 py-2"
                onClick={closeMenu}
              >
                <Plus className="h-4 w-4" />
                أضف إعلانك
              </Link>
              {user && (
                <Link
                  to="/bank-subscription"
                  className="text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-2 py-2"
                  onClick={closeMenu}
                >
                  <CreditCard className="h-4 w-4" />
                  تفعيل الاشتراك البنكي
                </Link>
              )}
              
              {/* Mobile Auth Section */}
              <div className="border-t border-gray-200 pt-4">
                {user ? (
                  <div className="flex flex-col space-y-2">
                    <Link 
                      to="/profile" 
                      className="text-gray-600 hover:text-blue-600 transition-colors py-2"
                      onClick={closeMenu}
                    >
                      الملف الشخصي
                    </Link>
                    <Link 
                      to="/notifications" 
                      className="text-gray-600 hover:text-blue-600 transition-colors py-2"
                      onClick={closeMenu}
                    >
                      الإشعارات
                    </Link>
                    <Link 
                      to="/messages" 
                      className="text-gray-600 hover:text-blue-600 transition-colors py-2"
                      onClick={closeMenu}
                    >
                      الرسائل
                    </Link>
                    <button 
                      onClick={async () => {
                        await signOut();
                        navigate('/auth');
                        closeMenu();
                      }}
                      className="text-red-600 hover:text-red-700 transition-colors py-2 text-left"
                    >
                      تسجيل الخروج
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <Link 
                      to="/auth" 
                      className="text-gray-600 hover:text-blue-600 transition-colors py-2"
                      onClick={closeMenu}
                    >
                      تسجيل الدخول
                    </Link>
                    <Link 
                      to="/auth" 
                      className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors text-center"
                      onClick={closeMenu}
                    >
                      إنشاء حساب
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
