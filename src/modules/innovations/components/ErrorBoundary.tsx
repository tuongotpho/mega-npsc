import React, { ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';

interface Props {
  // Children are optional in ErrorBoundary to support flexible usage.
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary component to catch and handle runtime errors gracefully.
 */
class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  // Use arrow function to preserve 'this' context when calling inherited setState.
  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-12 text-center border border-slate-100 animate-slide">
            <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-8">
              <AlertCircle size={48} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter uppercase">Đã có lỗi xảy ra</h2>
            <p className="text-slate-500 font-medium mb-10 leading-relaxed">
              Hệ thống gặp sự cố không mong muốn. Vui lòng thử làm mới trang hoặc liên hệ quản trị viên nếu sự cố tiếp diễn.
            </p>
            <div className="space-y-4">
              <button
                onClick={this.handleReset}
                className="w-full py-5 bg-orange-600 text-white rounded-2xl font-black shadow-xl shadow-orange-600/20 flex items-center justify-center gap-3 hover:bg-orange-700 transition-all uppercase tracking-widest text-xs"
              >
                <RefreshCcw size={18} /> Làm mới ứng dụng
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full py-5 bg-slate-100 text-slate-600 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-slate-200 transition-all uppercase tracking-widest text-xs"
              >
                <Home size={18} /> Quay lại trang chủ
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;