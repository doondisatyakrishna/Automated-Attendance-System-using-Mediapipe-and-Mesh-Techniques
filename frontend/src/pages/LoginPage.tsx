import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { loginRequest } from '../api';
import { LogoIcon } from '../components/icons'; // Using your LogoIcon

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await loginRequest(username, password);
      if (res.access_token) {
        toast.success("Login Successful!");
        login(res.access_token);
      }
    } catch (err: any) {
      toast.error(err.message || 'Invalid username or password.');
      setIsLoading(false);
    }
  };

  return (
    // This outer div centers everything vertically and horizontally
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      
      {/* This is the centered card with a maximum width */}
      <div className="w-full max-w-sm bg-surface p-8 rounded-2xl shadow-lg border border-border">
        
        {/* Logo is now on top */}
        <div className="text-center mb-6">
            <div className="inline-block text-primary">
              <LogoIcon className="h-12 w-12" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-text-primary">
                Sign in to your account
            </h2>
        </div>
        
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Username</label>
            <input 
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)} 
              required 
              className="w-full p-3 bg-background text-text-primary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Password</label>
            <input 
              type="password"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              className="w-full p-3 bg-background text-text-primary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary" 
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading} 
            className="w-full py-3 mt-6 bg-primary text-white font-semibold rounded-md hover:bg-primary/80 transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-text-secondary mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">
                Sign Up
            </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;