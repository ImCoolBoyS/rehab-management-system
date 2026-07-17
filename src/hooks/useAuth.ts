import { useState, useCallback, FormEvent } from 'react';
import { loginUser, setAuthToken } from '../lib/api';
import type { User } from '../types';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [usernameInput, setUsernameInput] = useState('admin');
  const [passwordInput, setPasswordInput] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleLoginSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const result = await loginUser(usernameInput.trim(), passwordInput);
      setSessionUser(result.user);
      setIsAuthenticated(true);
    } catch (err: any) {
      setLoginError(err?.response?.data?.detail || '登录失败，请检查网络连接。');
    }
  }, [usernameInput, passwordInput]);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    setSessionUser(null);
    setAuthToken(null);
    setUsernameInput('admin');
    setPasswordInput('admin123');
    setLoginError('');
  }, []);

  return {
    isAuthenticated, setIsAuthenticated,
    sessionUser, setSessionUser,
    usernameInput, setUsernameInput,
    passwordInput, setPasswordInput,
    showPassword, setShowPassword,
    loginError, setLoginError,
    handleLoginSubmit, handleLogout,
  };
}
