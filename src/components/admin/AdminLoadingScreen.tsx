
import React from 'react';

const AdminLoadingScreen = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
        <div className="text-lg font-medium text-gray-700">جاري التحقق...</div>
      </div>
    </div>
  );
};

export default AdminLoadingScreen;
