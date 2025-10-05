import React, { useState } from 'react';

const Profile: React.FC = () => {
    const [profile, setProfile] = useState({
        name: 'Dr. Evelyn Reed',
        employeeId: 'ER-84321',
        department: 'Computer Science',
        email: 'Evelyn@kluniversity.in',
        phone: '+1 (555) 123-4567',
        avatarUrl: 'https://i.pravatar.cc/150?u=faculty'
    });
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProfile(prev => ({...prev, [name]: value}));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setProfile(prev => ({...prev, avatarUrl: event.target?.result as string}));
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Profile Saved:", profile);
        // Here you would typically make an API call to save the data
    };

    return (
        <main className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold text-base-content mb-8">My Profile</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Avatar */}
                <div className="lg:col-span-1">
                    <div className="bg-base-100 p-6 rounded-xl shadow-soft border border-base-300/50 text-center">
                        <img 
                            src={profile.avatarUrl} 
                            alt="Profile Avatar"
                            className="w-40 h-40 rounded-full mx-auto mb-4 object-cover ring-4 ring-primary/20"
                        />
                         <h2 className="text-xl font-bold text-base-content">{profile.name}</h2>
                        <p className="text-base-content/60">{profile.department}</p>
                        <label htmlFor="avatarUpload" className="mt-4 inline-block bg-primary text-primary-content font-semibold px-4 py-2 rounded-lg cursor-pointer hover:bg-primary-focus transition-colors">
                            Change Picture
                        </label>
                        <input type="file" id="avatarUpload" className="hidden" onChange={handleFileChange} accept="image/*" />
                    </div>
                </div>

                {/* Right Column: Profile Form */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="bg-base-100 p-6 rounded-xl shadow-soft border border-base-300/50">
                        <h3 className="text-xl font-bold text-base-content mb-6">Personal Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-base-content/70 mb-1">Full Name</label>
                                <input type="text" name="name" value={profile.name} onChange={handleInputChange} className="w-full px-3 py-2 bg-base-200 border border-base-300 rounded-lg focus:ring-primary focus:border-primary" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-base-content/70 mb-1">Employee ID</label>
                                <input type="text" name="employeeId" value={profile.employeeId} onChange={handleInputChange} className="w-full px-3 py-2 bg-base-200 border border-base-300 rounded-lg focus:ring-primary focus:border-primary" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-base-content/70 mb-1">Department</label>
                                <select name="department" value={profile.department} onChange={handleInputChange} className="w-full px-3 py-2 bg-base-200 border border-base-300 rounded-lg focus:ring-primary focus:border-primary">
                                    <option>Computer Science</option>
                                    <option>Mechanical Engineering</option>
                                    <option>Arts & Humanities</option>
                                    <option>Business Administration</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-base-content/70 mb-1">Email Address</label>
                                <input type="email" name="email" value={profile.email} readOnly className="w-full px-3 py-2 bg-base-300/50 border border-base-300 rounded-lg text-base-content/60 cursor-not-allowed" />
                            </div>
                             <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-base-content/70 mb-1">Phone Number</label>
                                <input type="tel" name="phone" value={profile.phone} onChange={handleInputChange} className="w-full px-3 py-2 bg-base-200 border border-base-300 rounded-lg focus:ring-primary focus:border-primary" />
                            </div>
                        </div>
                        <div className="mt-8 text-right">
                            <button type="submit" className="bg-primary hover:bg-primary-focus text-primary-content font-bold py-2 px-6 rounded-lg transition-colors">
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
};

export default Profile;
