import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { ThemeSwitcher } from './ThemeSwitcher';
import { XMarkIcon, UserIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-toastify';
// Import the real API functions
import { getMyProfile, updateMyProfile, getSettings, updateSettings } from '../api';

type Tab = 'general' | 'profile' | 'rules';

// A sub-component for the profile form
const ProfileSettings = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Fetch REAL profile data when this tab opens
        const fetchProfile = async () => {
            try {
                const data = await getMyProfile();
                setName(data.name);
                setEmail(data.email);
                setAvatarUrl(data.avatar_url);
            } catch (error) {
                console.error("Failed to fetch profile for settings:", error);
                toast.error("Could not load profile data.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSave = async () => {
        // Update using REAL API
        try {
            const formData = new FormData();
            formData.append('name', name);
            // email might be read-only depending on your backend, but we'll send it if editable
            // formData.append('email', email); 
            await updateMyProfile(formData);
            toast.success("Profile updated successfully!");
        } catch (error) {
            toast.error("Failed to update profile.");
        }
    };

    if (isLoading) return <p className="text-text-secondary">Loading profile...</p>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                {avatarUrl ? (
                     <img 
                        src={`http://localhost:8000${avatarUrl}`} 
                        alt="Profile" 
                        className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                    />
                ) : (
                    <div className="w-16 h-16 rounded-full bg-background border-2 border-primary/20 flex items-center justify-center">
                        <UserIcon className="h-8 w-8 text-text-secondary" />
                    </div>
                )}
                <div>
                     <p className="text-sm font-medium text-text-secondary">Profile Picture</p>
                     <p className="text-xs text-text-tertiary">Change your picture in the main Profile page.</p>
                </div>
            </div>
            <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1">Full Name</label>
                <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    className="w-full p-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none transition-all" 
                />
            </div>
            <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1">Email Address</label>
                <input 
                    type="email" 
                    value={email} 
                    readOnly // Making email read-only here as it's often sensitive to change
                    className="w-full p-2.5 bg-background/50 border border-border rounded-lg text-text-secondary cursor-not-allowed" 
                />
            </div>
            <button 
                onClick={handleSave} 
                className="px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
            >
                Save Changes
            </button>
        </div>
    );
};

// A sub-component for the rules form
const RulesSettings = () => {
    const [lateHour, setLateHour] = useState(12);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Fetch REAL settings data
        const fetchSettings = async () => {
            try {
                const data = await getSettings();
                setLateHour(data.late_threshold_hour);
            } catch (error) {
                console.error("Failed to fetch settings:", error);
                // toast.error("Could not load settings.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        try {
            await updateSettings({ late_threshold_hour: lateHour });
            toast.success("Rules updated successfully!");
        } catch (error) {
            toast.error("Failed to update rules.");
        }
    };

    if (isLoading) return <p className="text-text-secondary">Loading rules...</p>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
                <div>
                    <label htmlFor="late-threshold" className="block font-medium text-text-primary">Late Threshold</label>
                    <p className="text-sm text-text-secondary">Students marked after this hour are 'Late'.</p>
                </div>
                <select 
                    id="late-threshold" 
                    value={lateHour} 
                    onChange={e => setLateHour(parseInt(e.target.value))} 
                    className="bg-surface border border-border rounded-lg p-2 text-text-primary focus:ring-2 focus:ring-primary/50 outline-none"
                >
                    {[9, 10, 11, 12, 13, 14, 15, 16, 17].map(h => (
                        <option key={h} value={h}>{h}:00 {h >= 12 ? 'PM' : 'AM'}</option>
                    ))}
                </select>
            </div>
            <button 
                onClick={handleSave} 
                className="px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
            >
                Save Changes
            </button>
        </div>
    );
};

export const SettingsModal: React.FC = () => {
  const { isSettingsOpen, toggleSettingsModal } = useSettings();
  const [activeTab, setActiveTab] = useState<Tab>('general');

  if (!isSettingsOpen) return null;

  const getTabClass = (tabName: Tab) => `w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === tabName ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-background hover:text-text-primary'}`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-surface w-full max-w-2xl rounded-2xl border border-border shadow-2xl flex overflow-hidden animate-scale-in">
        {/* Sidebar for tabs */}
        <div className="w-1/3 bg-background/50 border-r border-border p-4">
          <h2 className="text-xl font-bold text-text-primary mb-6 px-4">Settings</h2>
          <nav className="flex flex-col space-y-2">
            <button onClick={() => setActiveTab('general')} className={getTabClass('general')}>General</button>
            <button onClick={() => setActiveTab('profile')} className={getTabClass('profile')}>My Profile</button>
            <button onClick={() => setActiveTab('rules')} className={getTabClass('rules')}>Attendance Rules</button>
          </nav>
        </div>
        {/* Content Area */}
        <div className="w-2/3 p-6 relative max-h-[80vh] overflow-y-auto">
          <button onClick={toggleSettingsModal} className="absolute top-4 right-4 p-2 rounded-full text-text-tertiary hover:bg-background hover:text-text-primary transition-colors">
            <XMarkIcon className="h-5 w-5" />
          </button>
          {activeTab === 'general' && (
            <div>
              <h3 className="text-xl font-bold text-text-primary mb-6">General Settings</h3>
              <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
                <div>
                    <span className="font-medium text-text-primary block">Appearance</span>
                    <span className="text-sm text-text-secondary">Customize how FaceFive looks.</span>
                </div>
                <ThemeSwitcher />
              </div>
            </div>
          )}
          {activeTab === 'profile' && (
             <div>
                <h3 className="text-xl font-bold text-text-primary mb-6">My Profile</h3>
                <ProfileSettings />
             </div>
          )}
          {activeTab === 'rules' && (
             <div>
                <h3 className="text-xl font-bold text-text-primary mb-6">Attendance Rules</h3>
                <RulesSettings />
             </div>
          )}
        </div>
      </div>
    </div>
  );
};