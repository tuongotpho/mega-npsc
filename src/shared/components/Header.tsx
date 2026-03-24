
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { User } from '../types/common.ts';
import { MenuIcon, XIcon } from './Icons.tsx';

interface HeaderProps {
    user: User | null;
    onLogout: () => void;
    onGoHome?: () => void;
    showHomeBtn?: boolean;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, onGoHome, showHomeBtn }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="bg-primary text-white shadow-md p-4 flex justify-between items-center sticky top-0 z-30">
            <div className="flex items-center gap-4">
                {showHomeBtn && (
                    <Link 
                        to="/"
                        onClick={onGoHome}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2"
                        title="Về trang chủ Portal"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                        </svg>
                        <span className="hidden md:inline font-semibold">Trang chủ</span>
                    </Link>
                )}
                <h1 className="text-xl sm:text-2xl font-bold truncate">NPSC Portal</h1>
            </div>
            
            <div className="relative">
                {user ? (
                    <>
                        <div className="hidden sm:flex items-center space-x-4">
                            <div>
                                <span className="font-medium text-blue-100">Chào, </span>
                                <span className="font-bold">{user.name}</span>
                            </div>
                            <button
                                onClick={onLogout}
                                className="bg-accent hover:opacity-90 text-white font-bold py-2 px-4 rounded transition-colors"
                            >
                                Đăng xuất
                            </button>
                        </div>

                        <div className="sm:hidden">
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white focus:outline-none p-1">
                                {isMenuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
                            </button>
                        </div>

                        {isMenuOpen && (
                            <div className="sm:hidden absolute top-full right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-40 ring-1 ring-black ring-opacity-5 animate-fade-in">
                                <div className="px-4 py-3 border-b">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                                    <p className="text-xs text-gray-500">{user.role || 'Chờ duyệt'}</p>
                                </div>
                                <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Đăng xuất</a>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-sm font-medium text-blue-100">
                        Hệ thống tập trung NPSC
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
