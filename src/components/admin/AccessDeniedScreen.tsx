
import React from 'react';
import { Button } from '@/components/ui/button';
import { Shield, Home } from 'lucide-react';

interface AccessDeniedScreenProps {
  userEmail?: string;
}

const AccessDeniedScreen: React.FC<AccessDeniedScreenProps> = ({ userEmail }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="mb-6">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-red-600 mb-4">وصول غير مصرح</h1>
          <p className="text-gray-600 mb-4">لا تملك صلاحيات الوصول لهذه الصفحة</p>
          {userEmail && (
            <p className="text-sm text-gray-500 mb-6">البريد الإلكتروني: {userEmail}</p>
          )}
        </div>
        
        <Button 
          onClick={() => window.location.href = '/'}
          className="flex items-center gap-2 mx-auto"
        >
          <Home className="w-4 h-4" />
          العودة للصفحة الرئيسية
        </Button>
      </div>
    </div>
  );
};

export default AccessDeniedScreen;
