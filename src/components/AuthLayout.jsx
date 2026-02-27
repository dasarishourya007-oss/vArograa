import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AuthLayout = ({ title, subtitle, children, showBack = true }) => {
    const navigate = useNavigate();

    return (
        <div className="flex-col p-4" style={{ minHeight: '100vh', backgroundColor: 'var(--surface-color)' }}>
            {showBack && (
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        background: 'none',
                        marginBottom: 'var(--spacing-lg)',
                        display: 'flex',
                        alignItems: 'center',
                        color: 'var(--text-secondary)'
                    }}
                >
                    <ArrowLeft size={24} />
                </button>
            )}

            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: 'var(--spacing-xs)', color: 'var(--primary-color)' }}>{title}</h1>
                {subtitle && <p style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>}
            </div>

            <div className="flex-col" style={{ flex: 1 }}>
                {children}
            </div>
        </div>
    );
};

export default AuthLayout;
