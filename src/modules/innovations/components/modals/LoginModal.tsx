
import React, { useState } from 'react';
import { LogIn, Mail, Lock } from 'lucide-react';
import { authSangkien as auth } from '../../services/firebase';
import { useApp } from '../../contexts/AppContext';
import { useModal } from '../../contexts/ModalContext';

const LoginModal: React.FC = () => {
  const { isLoginOpen, closeLogin } = useModal();
  const { activeTheme } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  if (!isLoginOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await auth.signInWithEmailAndPassword(email, password);
      setAuthError('');
      closeLogin();
    } catch (err) {
      setAuthError('Email hoặc mật khẩu không đúng.');
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-[3rem] w-full max-w-md p-10 text-center space-y-8 animate-slide">
        <div className={`mx-auto ${activeTheme.primary} w-20 h-20 rounded-[2rem] flex items-center justify-center text-white shadow-xl mb-4`}><LogIn size={36} /></div>
        <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">Hệ thống Admin</h3>
        <form onSubmit={handleLogin} className="space-y-5 text-left">
          <div className="relative">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
                type="email" 
                placeholder="Email" 
                required 
                className="w-full pl-14 pr-6 py-5 bg-slate-50 text-slate-900 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-orange-500/10" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
                type="password" 
                placeholder="Mật khẩu" 
                required 
                className="w-full pl-14 pr-6 py-5 bg-slate-50 text-slate-900 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-orange-500/10" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
            />
          </div>
          {authError && <p className="text-[11px] font-black text-rose-500 text-center">{authError}</p>}
          <button className={`w-full py-5 ${activeTheme.primary} text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-xl hover:brightness-110 transition-all`}>Đăng nhập</button>
        </form>
        <button onClick={closeLogin} className="text-[10px] font-bold text-slate-300 uppercase hover:text-orange-500 transition-colors">Đóng</button>
      </div>
    </div>
  );
};

export default LoginModal;
