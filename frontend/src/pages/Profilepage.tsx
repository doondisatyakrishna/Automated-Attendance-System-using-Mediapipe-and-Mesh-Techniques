import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getMyProfile, updateMyProfile } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';
import { UserIcon } from '@heroicons/react/24/solid';

const initialProfileState: User = {
    id: '', username: '', name: '', email: '',
    department: null, phone_number: null, avatar_url: null,
    is_verified: false, is_phone_verified: false,
};

const ProfilePage: React.FC = () => {
    const { setUser } = useAuth();
    const [profile, setProfile] = useState<User>(initialProfileState);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await getMyProfile();
                setProfile(data);
                setUser(data);
            } catch (error) {
                toast.error("Could not load profile data.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, [setUser]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            // Create a local preview URL
            const reader = new FileReader();
            reader.onload = (event) => {
                setProfile(prev => ({ ...prev, avatar_url: event.target?.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        
        const formData = new FormData();
        formData.append('name', profile.name);
        formData.append('department', profile.department || '');
        formData.append('phone_number', profile.phone_number || '');
        if (avatarFile) {
            formData.append('avatar', avatarFile);
        }

        try {
            const updatedProfile = await updateMyProfile(formData);
            setProfile(updatedProfile);
            setUser(updatedProfile);
            setAvatarFile(null);
            toast.success("Profile saved successfully!");
        } catch (error) {
            toast.error("Failed to save profile.");
        } finally {
            setIsSaving(false);
        }
    };

    // Helper to determine the correct image source
    const getImageSrc = (url: string | null | undefined) => {
        if (!url) return null;
        if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http')) {
            return url;
        }
        return `http://localhost:8000${url}`;
    };

    if (isLoading) return <p className="text-center p-10 text-text-primary animate-pulse">Loading Profile...</p>;

    const avatarSrc = getImageSrc(profile.avatar_url);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-text-primary">My Profile</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Avatar */}
                <div className="lg:col-span-1">
                    <div className="bg-surface p-6 rounded-xl shadow-sm border border-border text-center">
                        {avatarSrc ? (
                            <img 
                                src={avatarSrc}
                                alt="Profile Avatar"
                                className="w-40 h-40 rounded-full mx-auto mb-4 object-cover ring-4 ring-primary/20"
                            />
                        ) : (
                            <div className="w-40 h-40 rounded-full mx-auto mb-4 bg-background border-4 border-primary/20 flex items-center justify-center">
                                <UserIcon className="h-20 w-20 text-text-secondary" />
                            </div>
                        )}
                        <h2 className="text-xl font-bold text-text-primary">{profile.name}</h2>
                        <p className="text-text-secondary">{profile.department || 'No department set'}</p>
                        <p className="text-sm text-text-tertiary mt-1">@{profile.username}</p>
                        
                        <label htmlFor="avatarUpload" className="mt-6 inline-flex items-center justify-center w-full px-4 py-2 bg-primary text-white font-semibold rounded-lg cursor-pointer hover:bg-primary-dark transition-colors">
                            Change Picture
                        </label>
                        <input type="file" id="avatarUpload" className="hidden" onChange={handleFileChange} accept="image/*" />
                    </div>
                </div>

                {/* Right Column - Form */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="bg-surface p-8 rounded-xl shadow-sm border border-border">
                        <h3 className="text-xl font-bold text-text-primary mb-6">Personal Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-text-secondary mb-1.5">Full Name</label>
                                <input 
                                    type="text" 
                                    name="name" 
                                    value={profile.name} 
                                    onChange={handleInputChange} 
                                    className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none transition-all" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-text-secondary mb-1.5">Username</label>
                                <input 
                                    type="text" 
                                    value={profile.username} 
                                    readOnly 
                                    className="w-full px-4 py-2.5 bg-background/50 border border-border rounded-lg text-text-tertiary cursor-not-allowed" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-text-secondary mb-1.5">Email Address</label>
                                <input 
                                    type="email" 
                                    value={profile.email} 
                                    readOnly 
                                    className="w-full px-4 py-2.5 bg-background/50 border border-border rounded-lg text-text-tertiary cursor-not-allowed" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-text-secondary mb-1.5">Department</label>
                                <select 
                                    name="department" 
                                    value={profile.department || ''} 
                                    onChange={handleInputChange} 
                                    className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                >
                                    <option value="">Select Department</option>
                                    <option>Computer Science</option>
                                    <option>Electronics and Computer Engineering</option>
                                    <option>Mechanical Engineering</option>
                                    {/* Add more departments as needed */}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-text-secondary mb-1.5">Phone Number</label>
                                <input 
                                    type="tel" 
                                    name="phone_number" 
                                    value={profile.phone_number || ''} 
                                    onChange={handleInputChange} 
                                    className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none transition-all" 
                                />
                            </div>
                        </div>
                        <div className="mt-8 flex justify-end">
                            <button 
                                type="submit" 
                                disabled={isSaving} 
                                className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-lg disabled:bg-primary/50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isSaving ? 'Saving Changes...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;