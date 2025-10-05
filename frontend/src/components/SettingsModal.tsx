import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { ThemeSwitcher } from './ThemeSwitcher';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-toastify';
// Assume you've created these api functions
// import { getMyProfile, updateMyProfile, getSettings, updateSettings } from '../api'; 

type Tab = 'general' | 'profile' | 'rules';

// A sub-component for the profile form
const ProfileSettings = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    useEffect(() => {
        // MOCK: Fetch profile data
        // getMyProfile().then(data => { setName(data.name); setEmail(data.email); });
        setName("Dr. Evanlyn Reed"); // Placeholder
        setEmail("Evelyn@kluniversity.in"); // Placeholder
    }, []);

    const handleSave = () => {
        // MOCK: Update profile data
        // updateMyProfile({ name, email }).then(() => toast.success("Profile updated!"));
        toast.success("Profile updated! (Mock)");
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-semibold text-text-secondary">Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 bg-background border border-border rounded-md" />
            </div>
            <div>
                <label className="block text-sm font-semibold text-text-secondary">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 bg-background border border-border rounded-md" />
            </div>
            <button onClick={handleSave} className="px-4 py-2 bg-primary text-white font-semibold rounded-md">Save Changes</button>
        </div>
    );
};

// A sub-component for the rules form
const RulesSettings = () => {
    const [lateHour, setLateHour] = useState(12);

    useEffect(() => {
        // MOCK: Fetch settings data
        // getSettings().then(data => setLateHour(data.late_threshold_hour));
    }, []);

    const handleSave = () => {
        // MOCK: Update settings data
        // updateSettings({ late_threshold_hour: lateHour }).then(() => toast.success("Rules updated!"));
        toast.success("Rules updated! (Mock)");
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label htmlFor="late-threshold" className="text-text-primary">Mark 'Late' after:</label>
                <select id="late-threshold" value={lateHour} onChange={e => setLateHour(parseInt(e.target.value))} className="bg-background border border-border rounded-md p-2">
                    {[9, 10, 11, 12, 13, 14].map(h => <option key={h} value={h}>{h}:00</option>)}
                </select>
            </div>
            <button onClick={handleSave} className="px-4 py-2 bg-primary text-white font-semibold rounded-md">Save Changes</button>
        </div>
    );
};

export const SettingsModal: React.FC = () => {
  const { isSettingsOpen, toggleSettingsModal } = useSettings();
  const [activeTab, setActiveTab] = useState<Tab>('general');

  if (!isSettingsOpen) return null;

  const getTabClass = (tabName: Tab) => `px-4 py-2 rounded-md font-semibold ${activeTab === tabName ? 'bg-primary/10 text-primary' : 'hover:bg-background'}`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface w-full max-w-2xl rounded-xl border border-border shadow-2xl flex">
        {/* Sidebar for tabs */}
        <div className="w-1/4 border-r border-border p-4">
          <h2 className="text-lg font-bold text-text-primary mb-4">Settings</h2>
          <nav className="flex flex-col space-y-1">
            <button onClick={() => setActiveTab('general')} className={getTabClass('general')}>General</button>
            <button onClick={() => setActiveTab('profile')} className={getTabClass('profile')}>My Profile</button>
            <button onClick={() => setActiveTab('rules')} className={getTabClass('rules')}>Rules</button>
          </nav>
        </div>
        {/* Content Area */}
        <div className="w-3/4 p-6 relative">
          <button onClick={toggleSettingsModal} className="absolute top-4 right-4 p-1 rounded-full hover:bg-background">
            <XMarkIcon className="h-6 w-6 text-text-secondary" />
          </button>
          {activeTab === 'general' && (
            <div>
              <h3 className="text-xl font-bold text-text-primary mb-4">General Settings</h3>
              <div className="flex items-center justify-between">
                <label className="font-semibold text-text-primary">Theme</label>
                <ThemeSwitcher />
              </div>
            </div>
          )}
          {activeTab === 'profile' && (
             <div>
                <h3 className="text-xl font-bold text-text-primary mb-4">My Profile</h3>
                <ProfileSettings />
             </div>
          )}
          {activeTab === 'rules' && (
             <div>
                <h3 className="text-xl font-bold text-text-primary mb-4">Attendance Rules</h3>
                <RulesSettings />
             </div>
          )}
        </div>
      </div>
    </div>
  );
};