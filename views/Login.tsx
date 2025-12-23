
import React, { useState } from 'react';
import { Employee } from '../types';
import { APP_NAME } from '../constants';

interface LoginProps {
  onLogin: (user: Employee) => void;
  employees: Employee[];
}

const Login: React.FC<LoginProps> = ({ onLogin, employees }) => {
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = employees.find(emp => emp.code === code && emp.password === password);
    if (user) {
      onLogin(user);
    } else {
      setError('خطأ في اسم المستخدم أو كلمة المرور');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-md shadow-2xl">
        <div className="text-center mb-10">
          <div className="inline-block bg-blue-600 text-white p-4 rounded-3xl font-black text-2xl mb-4 italic shadow-lg shadow-blue-900/20">
            PRIME HR
          </div>
          <h1 className="text-2xl font-black text-white">{APP_NAME}</h1>
          <p className="text-slate-500 mt-2 font-bold">يرجى تسجيل الدخول للوصول إلى النظام</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-400 mb-2">اسم المستخدم / المعرف</label>
            <input 
              type="text" 
              value={code} 
              onChange={e => setCode(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white font-bold focus:ring-2 focus:ring-blue-600 outline-none transition-all"
              placeholder="مثال: admin"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-400 mb-2">كلمة المرور</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white font-bold focus:ring-2 focus:ring-blue-600 outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm font-bold text-center animate-pulse">{error}</p>}

          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/20 active:scale-[0.98]"
          >
            تسجيل الدخول
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-slate-600 text-xs">نظام برايم الأصالة لإدارة الموارد البشرية - العراق © 2024</p>
        </div>
      </div>
    </div>
  );
};

export default Login;