import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

class SafeErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    backgroundColor: '#fff',
                    borderRadius: '24px',
                    margin: '20px',
                    border: '2px dashed #fee2e2'
                }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '20px',
                        backgroundColor: '#fef2f2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px'
                    }}>
                        <AlertCircle size={32} className="text-red-500" />
                    </div>
                    <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>Something went wrong</h2>
                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>
                        We encountered an error while rendering this section.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            margin: '0 auto',
                            padding: '12px 24px',
                            backgroundColor: '#1f2937',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '16px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        <RefreshCw size={16} /> Reload Page
                    </button>
                    {import.meta.env.DEV && (
                        <pre style={{
                            marginTop: '24px',
                            padding: '16px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '12px',
                            fontSize: '10px',
                            color: '#ef4444',
                            textAlign: 'left',
                            overflow: 'auto',
                            maxHeight: '200px'
                        }}>
                            {this.state.error?.toString()}
                        </pre>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default SafeErrorBoundary;
