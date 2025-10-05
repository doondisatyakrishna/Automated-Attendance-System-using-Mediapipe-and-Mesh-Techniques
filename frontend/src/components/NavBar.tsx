import React from 'react';
import { NavLink } from 'react-router-dom';
import { ThemeSwitcher } from './ThemeSwitcher';
import { ProfileDropdown } from './ProfileDropdown';
import { LogoIcon } from './icons'; // Assuming you have a LogoIcon component

const Navbar: React.FC = () => {
    
    // This function provides dynamic, theme-aware classes for the nav links
    const getNavLinkClass = ({ isActive }: { isActive: boolean }) => {
        const baseClasses = "px-4 py-2 rounded-lg text-sm font-semibold transition-colors";
        const activeClasses = "bg-primary/10 text-primary";
        const inactiveClasses = "text-text-secondary hover:bg-background hover:text-text-primary";
        return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
    };

    return (
        <nav className="bg-surface/80 backdrop-blur-md shadow-sm sticky top-0 z-20 border-b border-border">
            <div className="container mx-auto px-4">
                <div className="flex items-center h-16">
                    {/* --- Left Side: Logo and Brand Name --- */}
                    <div className="flex items-center gap-3">
                        <div className="text-primary">
                            <LogoIcon />
                        </div>
                        <h1 className="text-xl font-bold text-text-primary">
                           Automated Attendance
                        </h1>
                    </div>

                    {/* --- Centered Navigation Links --- */}
                    {/* The flex-1 class makes this div grow to fill all available space */}
                    <div className="flex-1 flex justify-center">
                        {/* This inner div groups the links with a nice background */}
                        <div className="flex items-center gap-2 p-1 bg-background rounded-xl border border-border">
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