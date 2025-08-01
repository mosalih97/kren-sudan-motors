import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Bell, MessageCircle, Plus, User, Menu, X, Settings, Users } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { useUserPoints } from '@/hooks/useUserPoints';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { pointsData } = useUserPoints();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isAdmin = user?.email === 'm.el3min3@gmail.com';

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo section */}
          <Link to="/" className="text-2xl font-bold text-primary">
            الكرين
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4 space-x-reverse">
            <Link to="/cars">
              <Button variant="ghost" className="text-foreground hover:text-primary">
                السيارات
              </Button>
            </Link>
            
            {user ? (
              <>
                <Link to="/add-ad">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة إعلان
                  </Button>
                </Link>
                
                <Link to="/messages">
                  <Button variant="ghost" size="icon">
                    <MessageCircle className="w-5 h-5" />
                  </Button>
                </Link>
                
                <Link to="/notifications">
                  <Button variant="ghost" size="icon">
                    <Bell className="w-5 h-5" />
                  </Button>
                </Link>

                {isAdmin && (
                  <Link to="/admin/users">
                    <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700">
                      <Users className="w-4 h-4 ml-1" />
                      إدارة المستخدمين
                    </Button>
                  </Link>
                )}
                
                <Link to="/profile">
                  <Button variant="ghost" size="icon">
                    <User className="w-5 h-5" />
                  </Button>
                </Link>
                
                <div className="text-sm">
                  النقاط: {pointsData?.totalPoints || 0}
                </div>
                
                <Button variant="outline" onClick={handleSignOut}>
                  تسجيل الخروج
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button>تسجيل الدخول</Button>
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 border-t border-border">
            <div className="flex flex-col space-y-2 pt-4">
              <Link to="/cars" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-foreground hover:text-primary">
                  السيارات
                </Button>
              </Link>
              
              {user ? (
                <>
                  <Link to="/add-ad" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full justify-start bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Plus className="w-4 h-4 ml-2" />
                      إضافة إعلان
                    </Button>
                  </Link>
                  
                  <Link to="/messages" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <MessageCircle className="w-4 h-4 ml-2" />
                      الرسائل
                    </Button>
                  </Link>
                  
                  <Link to="/notifications" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <Bell className="w-4 h-4 ml-2" />
                      الإشعارات
                    </Button>
                  </Link>

                  {isAdmin && (
                    <Link to="/admin/users" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start text-orange-600 hover:text-orange-700">
                        <Users className="w-4 h-4 ml-2" />
                        إدارة المستخدمين
                      </Button>
                    </Link>
                  )}
                  
                  <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <User className="w-4 h-4 ml-2" />
                      الملف الشخصي
                    </Button>
                  </Link>
                  
                  <div className="text-sm px-3 py-2">
                    النقاط: {pointsData?.totalPoints || 0}
                  </div>
                  
                  <Button variant="outline" onClick={handleSignOut} className="w-full">
                    تسجيل الخروج
                  </Button>
                </>
              ) : (
                <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full">تسجيل الدخول</Button>
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
