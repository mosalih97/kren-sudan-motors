
import React from 'react';
import { Button } from '@/components/ui/button';
import { Shield, Home, AlertTriangle } from 'lucide-react';

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
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mx-auto mb-2" />
            <p className="text-gray-700 text-sm mb-2 font-medium">لا تملك صلاحيات الوصول لهذه الصفحة</p>
            {userEmail && (
              <div className="text-sm text-gray-600">
                <p className="font-medium">البريد الإلكتروني:</p>
                <p className="bg-gray-100 p-2 rounded mt-1 font-mono text-xs break-all">{userEmail}</p>
              </div>
            )}
          </div>
          <div className="text-xs text-gray-500 mb-6 bg-gray-100 p-3 rounded">
            <p className="font-medium mb-1">للحصول على صلاحيات المدير:</p>
            <p>تأكد من إضافة بريدك الإلكتروني لجدول admin_users في قاعدة البيانات</p>
          </div>
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
