import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { UserCircleIcon, Cog6ToothIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/solid';

export const ProfileDropdown: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const { toggleSettingsModal } = useSettings();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNavigateToProfile = () => {
        navigate('/profile');
        setIsOpen(false);
    };

    const handleOpenSettings = () => {
        toggleSettingsModal();
        setIsOpen(false);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
        setIsOpen(false);
    };

    // Helper to get the correct avatar URL
    const getAvatarUrl = () => {
        if (user?.avatar_url) {
            return user.avatar_url.startsWith('http') 
                ? user.avatar_url 
                : `http://localhost:8000${user.avatar_url}`;
        }
        // Default placeholder if no avatar is set
        return "https://cdn-icons-png.flaticon.com/512/847/847969.png";
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background overflow-hidden border-2 border-border"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <img
                    src={getAvatarUrl()}
                    alt={`${user?.username || 'User'} avatar`}
                    className="w-full h-full object-cover"
                />
            </button>

            {isOpen && (
                <div 
                    className="absolute right-0 mt-2 w-56 origin-top-right bg-surface rounded-lg shadow-xl border border-border focus:outline-none z-50 animate-scale-in"
                    role="menu"
                    aria-orientation="vertical"
                >
                    <div className="p-2" role="none">
                        <div className="px-3 py-2">
                            <p className="text-sm font-semibold text-text-primary truncate">{user?.name || user?.username || 'User'}</p>
                            <p className="text-xs text-text-secondary truncate">{user?.email || 'No email set'}</p>
                        </div>

                        <div className="h-px bg-border my-1"></div>
                        
                        <button
                            onClick={handleNavigateToProfile}
                            className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-text-primary rounded-md hover:bg-background transition-colors"
                            role="menuitem"
                        >
                            <UserCircleIcon className="w-5 h-5 text-text-secondary" />
                            <span>My Profile</span>
                        </button>
                        <button
                            onClick={handleOpenSettings}
                            className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-text-primary rounded-md hover:bg-background transition-colors"
                            role="menuitem"
                        >
                            <Cog6ToothIcon className="w-5 h-5 text-text-secondary" />
                            <span>Settings</span>
                        </button>
                        <div className="h-px bg-border my-1"></div>
                        <button
                            onClick={handleLogout}
                            className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-red-500 rounded-md hover:bg-red-500/10 transition-colors"
                            role="menuitem"
                        >
                            <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileDropdown;