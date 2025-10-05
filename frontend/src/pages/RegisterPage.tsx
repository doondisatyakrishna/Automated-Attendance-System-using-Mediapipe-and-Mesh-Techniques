import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { CameraIcon } from '@heroicons/react/24/solid';
import { registerRequest } from '../api';

const RegisterPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone_number, setPhoneNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length > 72) {
            toast.error("Password cannot be longer than 72 characters.");
            return;
        }
        setIsLoading(true);
        try {
            await registerRequest(username, email, password, phone_number);
            toast.success("Registration successful! Check your phone for a verification code.");
            navigate('/verify', { state: { username } });
        } catch (error: any) {
            toast.error(error.message || "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=2070')" }}>
            <div className="max-w-md w-full bg-surface/80 backdrop-blur-sm rounded-2xl border border-border shadow-2xl p-8 space-y-6">
                <div className="text-center">
                    <div className="flex justify-center items-center mb-4"><div className="bg-primary p-3 rounded-full"><CameraIcon className="h-10 w-10 text-white" /></div></div>
                    <h2 className="mt-4 text-3xl font-extrabold text-text-primary">Create Your Account</h2>
                </div>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required className="w-full p-3 bg-background text-text-primary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary" />
                    <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-3 bg-background text-text-primary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary" />
                    <input type="password" placeholder="Password (max 72 characters)" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-3 bg-background text-text-primary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary" />
                    <input type="tel" placeholder="Phone Number (e.g., +919876543210)" value={phone_number} onChange={e => setPhoneNumber(e.target.value)} required className="w-full p-3 bg-background text-text-primary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary" />
                    <button type="submit" disabled={isLoading} className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-md hover:bg-primary/80 transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed">
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>
                <p className="text-center text-sm text-text-secondary">Already have an account? <Link to="/login" className="font-medium text-primary hover:underline">Sign In</Link></p>
            </div>
        </div>
    );
};

export default RegisterPage;