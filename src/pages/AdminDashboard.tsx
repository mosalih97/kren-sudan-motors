
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import DashboardStats from '@/components/admin/DashboardStats';
import UsersManagement from '@/components/admin/UsersManagement';
import AdsManagement from '@/components/admin/AdsManagement';
import AdminSettings from '@/components/admin/AdminSettings';

const AdminDashboard: React.FC = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<DashboardStats />} />
        <Route path="/users" element={<UsersManagement />} />
        <Route path="/ads" element={<AdsManagement />} />
        <Route path="/settings" element={<AdminSettings />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminDashboard;
