
import React from 'react';

/**
 * Module Template - Entry Point
 * 
 * Đây là template chuẩn cho một module mới trong NPSC MegaApp.
 * Copy thư mục _template/ và đổi tên để bắt đầu phát triển module mới.
 * 
 * Cách sử dụng:
 * 1. Copy thư mục _template/ → tên module mới (VD: party-members/)
 * 2. Đổi tên component TemplateModule → tên module (VD: PartyMembersModule)
 * 3. Thêm module vào src/App.tsx (ActiveModule type + routing)
 * 4. Thêm card vào ModuleSelector.tsx  
 * 5. Tạo Firebase config riêng (nếu cần) trong services/firebase.ts
 */

interface TemplateModuleProps {
    onBack: () => void;
    // Thêm props cần thiết từ App shell:
    // currentUser?: User;
    // firebaseUser?: any;
}

const TemplateModule: React.FC<TemplateModuleProps> = ({ onBack }) => {
    return (
        <div className="p-8 max-w-4xl mx-auto">
            <button 
                onClick={onBack}
                className="mb-6 text-blue-600 hover:text-blue-800 font-bold flex items-center gap-2"
            >
                ← Quay lại Portal
            </button>
            <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
                <h2 className="text-3xl font-black text-gray-800 mb-4">Module Template</h2>
                <p className="text-gray-500">Thay thế nội dung này bằng module thực tế của bạn.</p>
            </div>
        </div>
    );
};

export default TemplateModule;
