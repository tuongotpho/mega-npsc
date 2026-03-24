import React from 'react';

interface AlertModalProps {
  title: string;
  message: string;
  onClose: () => void;
}

const AlertModal: React.FC<AlertModalProps> = ({ title, message, onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-primary mb-4">{title}</h3>
        <p className="text-gray-600 mb-6 whitespace-pre-wrap">{message}</p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-primary text-white font-bold py-2 px-6 rounded-md hover:opacity-90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
