
import React from 'react';

const AdminLoadingScreen = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
        <div className="text-xl font-semibold text-gray-700 mb-2">التحقق من الصلاحيات...</div>
        <div className="text-sm text-gray-500 mb-4">يرجى الانتظار لحظة</div>
        <div className="text-xs text-gray-400">
          <p>جاري التحقق من صلاحيات الإدارة</p>
          <p>والتأكد من بيانات المستخدم</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoadingScreen;
