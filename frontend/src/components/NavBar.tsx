import React from 'react';
import { NavLink } from 'react-router-dom';
import { ThemeSwitcher } from './ThemeSwitcher';
import { ProfileDropdown } from './ProfileDropdown';
import { LogoIcon } from './icons';

const Navbar: React.FC = () => {
    
    const getNavLinkClass = ({ isActive }: { isActive: boolean }) => {
        // Changed base rounded to 'rounded-full' for a pill/bubble shape
        const baseClasses = "px-5 py-2.5 text-sm font-semibold transition-all duration-200 ease-in-out rounded-full";
        
        // Active state now has a shadow and stronger background pop
        const activeClasses = "bg-primary text-white shadow-md transform scale-105";
        
        // Inactive state has a subtle hover effect
        const inactiveClasses = "text-text-secondary hover:bg-surface hover:text-text-primary";
        
        return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
    };

    return (
        <nav className="bg-surface/80 backdrop-blur-md shadow-sm sticky top-0 z-20 border-b border-border">
            <div className="container mx-auto px-4">
                <div className="flex items-center h-16">
                    {/* --- Left Side: Logo --- */}
                    <div className="flex items-center gap-3">
                        <div className="text-primary">
                            <LogoIcon className="h-8 w-8" />
                        </div>
                        <h1 className="text-xl font-bold text-text-primary hidden md:block">
                           Automated Attendance
                        </h1>
                    </div>

                    {/* --- Centered Navigation Bubble --- */}
                    <div className="flex-1 flex justify-center">
                        {/* Outer container is now the "track" for the bubbles.
                            Added 'p-1.5' for a bit more spacing around the pills.
                            Added 'shadow-inner' for depth.
                        */}
                        <div className="flex items-center gap-1 p-1.5 bg-background/50 backdrop-blur-sm rounded-full border border-border/50 shadow-inner">
                            <NavLink to="/dashboard" className={getNavLinkClass}>Dashboard</NavLink>
                            <NavLink to="/take-attendance" className={getNavLinkClass}>Take Attendance</NavLink>
                            <NavLink to="/students" className={getNavLinkClass}>Students</NavLink>
                            <NavLink to="/analytics" className={getNavLinkClass}>Analytics</NavLink>
                        </div>
                    </div>

                    {/* --- Right Side: Controls --- */}
                    <div className="flex items-center gap-4">
                        <ThemeSwitcher />
                        <ProfileDropdown />
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;