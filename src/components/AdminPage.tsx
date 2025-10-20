import React, { useState, useEffect } from 'react';
import { isAdminLoggedIn } from '../admin_api';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import { Toaster } from 'react-hot-toast';

interface AdminPageProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ isDarkMode, onToggleTheme }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 检查是否已经登录
    const checkLoginStatus = () => {
      const loggedIn = isAdminLoggedIn();
      setIsLoggedIn(loggedIn);
      setIsLoading(false);
    };

    checkLoginStatus();
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  if (isLoading) {
    return null;
  }

  return (
    <>
      {isLoggedIn ? (
        <AdminDashboard onLogout={handleLogout} isDarkMode={isDarkMode} onToggleTheme={onToggleTheme} />
      ) : (
        <AdminLogin onLoginSuccess={handleLoginSuccess} />
      )}
      <Toaster position="top-center" />
    </>
  );
};

export default AdminPage;