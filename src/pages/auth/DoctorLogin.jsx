import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';

const DoctorLogin = () => {
    const navigate = useNavigate();
    const { loginDoctor, completeLogin } = useAuth(); // We will create this

    const [code, setCode] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();

        // Master Login Shortcut
        if (code === '123' && pin === 'dsa') {
            const result = await loginDoctor(code, pin);
            if (result.success) {
                completeLogin(result.doctor);
                navigate('/dashboard/doctor');
                return;
            }
        }

        const result = await loginDoctor(code.toUpperCase(), pin);
        if (result.success) {
            completeLogin(result.user || result.doctor); // Ensuring user/doctor object is passed
            navigate('/dashboard/doctor');
        } else {
            setError(result.message || 'Login failed');
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
                <AuthLayout title="Doctor Login" subtitle="Access your Dashboard" showBack={true}>
                    <form onSubmit={handleLogin} className="flex-col" style={{ gap: 'var(--spacing-md)' }}>
                        {error && <div style={{ color: 'var(--danger-color)', marginBottom: '10px' }}>{error}</div>}
                        <Input
                            label="Doctor ID"
                            placeholder="DOC-XXXX"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            required
                        />
                        <Input
                            label="Passkey"
                            type="password"
                            placeholder="****"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            required
                        />
                        <div style={{ textAlign: 'right', marginTop: '4px' }}>
                            <span onClick={() => navigate('/recovery/doctor')} style={{ fontSize: '12px', color: '#3b82f6', cursor: 'pointer' }}>Forgot Passkey?</span>
                        </div>

                        <div style={{ marginTop: 'var(--spacing-md)' }}>
                            <Button type="submit" size="block">Login</Button>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '16px' }}>
                            <span onClick={() => navigate('/register/doctor')} style={{ color: 'var(--primary-color)', fontWeight: 'bold', cursor: 'pointer' }}>Register</span>
                            <span onClick={() => navigate('/status/doctor')} style={{ color: '#666', cursor: 'pointer', textDecoration: 'underline' }}>Check Approval Status</span>
                        </div>
                    </form>
                </AuthLayout>
            </div>
        </div>
    );
};

export default DoctorLogin;
