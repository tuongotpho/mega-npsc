
import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { auth, db, googleProvider, firebase } from './modules/projects/services/firebase.ts';
import type { User } from './shared/types/common.ts';

// Components chung
import Header from './shared/components/Header.tsx';
import Footer from './shared/components/Footer.tsx';
import ModuleSelector from './shared/components/ModuleSelector.tsx';

// Modules (Các phân hệ app)
import ProjectManagementModule from './modules/projects/index.tsx';
import InnovationModule from './modules/innovations/index.tsx';

const App: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [firebaseUser, setFirebaseUser] = useState<firebase.User | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    const isPortal = location.pathname === '/';

    // Xử lý Đăng nhập chung cho toàn hệ thống
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (!userDoc.exists) {
                    await db.collection('users').doc(user.uid).set({
                        email: user.email,
                        name: user.displayName || 'Người dùng mới',
                        role: null,
                    });
                }
                setFirebaseUser(user);
            } else {
                setFirebaseUser(null);
                setCurrentUser(null);
            }
            setIsAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!firebaseUser) return;
        const unsubscribe = db.collection('users').doc(firebaseUser.uid).onSnapshot((doc) => {
            if (doc.exists) setCurrentUser({ id: doc.id, ...doc.data() } as User);
        });
        return () => unsubscribe();
    }, [firebaseUser]);

    if (isAuthLoading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-bold text-blue-900 animate-pulse">NPSC DIGITAL SYSTEM STARTING...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-neutral flex flex-col transition-all duration-500">
            {/* Header chỉ hiện khi đã vào sâu trong module, trang Portal sẽ ẩn đi cho đẹp */}
            {!isPortal && (
                <Header
                    user={currentUser}
                    onLogout={() => auth.signOut()}
                    onGoHome={() => navigate('/')}
                    showHomeBtn={true}
                />
            )}

            <main className={`flex-grow ${isPortal ? '' : 'animate-fade-in'}`}>
                <Routes>
                    <Route path="/" element={<ModuleSelector />} />
                    <Route path="/SCL/*" element={
                        <ProjectManagementModule
                            currentUser={currentUser}
                            firebaseUser={firebaseUser}
                        />
                    } />
                    <Route path="/sangkien/*" element={
                        <InnovationModule onBack={() => navigate('/')} />
                    } />
                    {/* Catch-all: redirect về Portal */}
                    <Route path="*" element={<ModuleSelector />} />
                </Routes>
            </main>

            <Footer />
        </div>
    );
};

export default App;
