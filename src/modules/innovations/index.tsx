
import React from 'react';
import { AppProvider } from './contexts/AppContext.tsx';
import { ModalProvider } from './contexts/ModalContext.tsx';
import SangkienApp from './components/SangkienApp.tsx';

interface InnovationModuleProps {
    onBack: () => void;
}

const InnovationModule: React.FC<InnovationModuleProps> = ({ onBack }) => {
    return (
        <AppProvider>
            <ModalProvider>
                <SangkienApp onBack={onBack} />
            </ModalProvider>
        </AppProvider>
    );
};

export default InnovationModule;
