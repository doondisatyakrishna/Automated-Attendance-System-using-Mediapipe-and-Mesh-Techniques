import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ShieldCheckIcon } from '@heroicons/react/24/solid';
import { verifyAccountRequest } from '../api';
import { useAuth } from '../contexts/AuthContext';

const VerifyPage: React.FC = () => {
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const username = location.state?.username;

    useEffect(() => {
        if (!username) {
            toast.error("An error occurred. Please try registering again.");
            navigate('/register');
        }
    }, [username, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const { access_token } = await verifyAccountRequest(username, code);
            login(access_token);
            toast.success("Account verified successfully! Welcome.");
            // The AuthContext will handle the navigation to the dashboard
        } catch (error: any) {
            toast.error(error.message || "Verification failed. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=2070')" }}>
            <div className="max-w-md w-full bg-surface/80 backdrop-blur-sm rounded-2xl border border-border shadow-2xl p-8 space-y-6 text-center">
                <div className="flex justify-center items-center mb-4"><div className="bg-primary p-3 rounded-full"><ShieldCheckIcon className="h-10 w-10 text-white" /></div></div>
                <h2 className="text-3xl font-extrabold text-text-primary">Enter Verification Code</h2>
                <p className="text-text-secondary">A 6-digit code was sent to the phone number associated with the username <span className="font-bold text-text-primary">{username}</span>.</p>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <input type="text" placeholder="______" value={code} onChange={e => setCode(e.target.value.replace(/[^0-9]/g, ''))} required maxLength={6} className="w-full p-3 bg-background text-text-primary border border-border rounded-md text-center text-2xl tracking-[1em] focus:outline-none focus:ring-2 focus:ring-primary" />
                    <button type="submit" disabled={isLoading} className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-md hover:bg-primary/80 transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed">
                        {isLoading ? 'Verifying...' : 'Verify & Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default VerifyPage;