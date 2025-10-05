import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// --- Hooks for authentication, navigation, and settings modal ---
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

// --- Using the standard icons from your project ---
import { UserCircleIcon, Cog6ToothIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/solid';

export const ProfileDropdown: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // --- Hooks to control app state ---
    const { logout, user } = useAuth(); // Assuming 'user' object is available from your AuthContext
    const navigate = useNavigate();
    const { toggleSettingsModal } = useSettings();

    // --- Effect to close the dropdown when clicking outside ---
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
        navigate('/profile'); // Navigate to a dedicated profile page
        setIsOpen(false);
    };

    const handleOpenSettings = () => {
        toggleSettingsModal(); // Open the settings modal
        setIsOpen(false);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* --- Polished UI with real avatar image --- */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                {/* Placeholder avatar, can be replaced with user.avatarUrl */}
                <img
                    src={`https://i.pravatar.cc/150?u=faculty?u=${user?.email || 'faculty'}`}
                    alt="User avatar"
                    className="w-full h-full rounded-full object-cover"
                />
            </button>

            {isOpen && (
                <div 
                    className="absolute right-0 mt-2 w-56 origin-top-right bg-surface rounded-lg shadow-xl border border-border focus:outline-none"
                    role="menu"
                    aria-orientation="vertical"
                >
                    <div className="p-2" role="none">
                        {/* --- Dynamically displays the logged-in user's info --- */}
                        <div className="px-3 py-2">
                            <p className="text-sm font-semibold text-text-primary">{user?.name || 'Dr. Evanlyn Reed'}</p>
                            <p className="text-xs text-text-secondary truncate">{user?.email || 'Evelyn@kluniversity.in'}</p>
                        </div>

                        <div className="h-px bg-border my-1"></div>
                        
                        {/* --- Updated onClick handlers for Profile, Settings, and Logout --- */}
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