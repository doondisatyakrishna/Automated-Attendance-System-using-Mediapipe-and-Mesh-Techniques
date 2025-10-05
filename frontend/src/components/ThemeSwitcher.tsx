import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { SunIcon, MoonIcon, SparklesIcon } from '@heroicons/react/24/solid';

export const ThemeSwitcher: React.FC = () => {
    const { theme, setTheme } = useTheme();

    return (
        <div className="flex items-center p-1 rounded-full bg-background border border-border">
            <button onClick={() => setTheme('light')} className={`p-2 rounded-full ${theme === 'light' ? 'bg-primary text-white' : ''}`}>
                <SunIcon className="h-5 w-5" />
            </button>
            <button onClick={() => setTheme('ocean')} className={`p-2 rounded-full ${theme === 'ocean' ? 'bg-primary text-white' : ''}`}>
                <SparklesIcon className="h-5 w-5" />
            </button>
            <button onClick={() => setTheme('dark')} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-primary text-white' : ''}`}>
                <MoonIcon className="h-5 w-5" />
            </button>
        </div>
    );
};