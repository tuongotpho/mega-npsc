import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class GlobalErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service here
    console.error('Global Application Error:', error, errorInfo);
  }

  public handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-200">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <AlertTriangle size={36} strokeWidth={2} />
            </div>
            
            <h2 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">
              Đã xảy ra lỗi hệ thống
            </h2>
            
            <p className="text-slate-500 text-sm mb-8 leading-relaxed font-medium">
              Ứng dụng gặp sự cố không mong muốn. Dữ liệu của bạn vẫn an toàn. Vui lòng tải lại trang để tiếp tục làm việc.
            </p>

            <div className="space-y-4">
              <button
                onClick={this.handleReload}
                className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95"
              >
                <RefreshCcw size={16} />
                Tải lại ứng dụng
              </button>
              
              {this.state.error && (
                <div className="bg-slate-100 p-3 rounded-lg overflow-hidden">
                    <p className="text-[10px] text-slate-400 font-mono break-all">
                        Error: {this.state.error.message}
                    </p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;