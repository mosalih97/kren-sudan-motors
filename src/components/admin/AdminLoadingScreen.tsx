
import React from 'react';
import { Loader2, Shield } from 'lucide-react';

const AdminLoadingScreen = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-blue-600 mr-2" />
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
        <div className="text-lg font-medium text-gray-700 mb-2">جاري التحقق من الصلاحيات...</div>
        <div className="text-sm text-gray-500">يرجى الانتظار</div>
      </div>
    </div>
  );
};

export default AdminLoadingScreen;
