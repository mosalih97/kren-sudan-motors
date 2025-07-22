import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Plus, User, Heart, MessageCircle, Crown, Menu } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/40 backdrop-blur-xl bg-background/80">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* الشعار */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl primary-gradient flex items-center justify-center">
                <span className="text-white font-bold text-xl">ك</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold primary-gradient bg-clip-text text-transparent">
                  الكرين
                </h1>
                <p className="text-xs text-muted-foreground">سوق السيارات السوداني</p>
              </div>
            </div>
          </div>

          {/* القائمة الرئيسية - سطح المكتب */}
          <nav className="hidden md:flex items-center gap-6">
            <Button variant="ghost" className="text-foreground hover:text-primary">
              الرئيسية
            </Button>
            <Button variant="ghost" className="text-foreground hover:text-primary">
              السيارات
            </Button>
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
            {/* الكريديت */}
            <div className="hidden sm:flex items-center gap-2 bg-primary-light rounded-full px-3 py-2">
              <Crown className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">5 كريديت</span>
            </div>

            {/* الإشعارات */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
                3
              </Badge>
            </Button>

            {/* المفضلة */}
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Heart className="h-5 w-5" />
            </Button>

            {/* الرسائل */}
            <Button variant="ghost" size="icon" className="hidden sm:flex relative">
              <MessageCircle className="h-5 w-5" />
              <Badge variant="accent" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
                2
              </Badge>
            </Button>

            {/* إضافة إعلان */}
            <Button variant="accent" className="hidden sm:flex">
              <Plus className="h-4 w-4 ml-2" />
              أضف إعلان
            </Button>

            {/* الملف الشخصي */}
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
            </Button>

            {/* قائمة الموبايل */}
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* شريط سريع للموبايل */}
        <div className="flex md:hidden items-center justify-center gap-2 mt-4">
          <Button variant="accent" size="sm" className="flex-1">
            <Plus className="h-4 w-4 ml-1" />
            أضف إعلان
          </Button>
          <Button variant="outline" size="sm">
            <Heart className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="relative">
            <MessageCircle className="h-4 w-4" />
            <Badge variant="accent" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">2</Badge>
          </Button>
        </div>
      </div>
    </header>
  );
}