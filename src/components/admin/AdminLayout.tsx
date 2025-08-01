
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';
import { Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/hooks/useAdminAuth';

export const AdminLayout = () => {
  const { adminUser } = useAdminAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-16 flex items-center justify-between border-b bg-background px-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold">لوحة تحكم الإدارة</h1>
            </div>
            
            <div className="flex items-center space-x-2 space-x-reverse">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
              <div className="text-sm">
                <p className="font-medium">{adminUser?.name}</p>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6 bg-gray-50/30">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
