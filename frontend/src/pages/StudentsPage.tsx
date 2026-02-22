import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { Student } from '../types';
import { EmptyState } from '../components/EmptyState';
import { PlusIcon, PencilIcon, TrashIcon, VideoCameraIcon, CameraIcon, UserIcon, XMarkIcon, UserGroupIcon } from '@heroicons/react/24/solid';
import { listStudents, createStudent, deleteStudent, updateStudentDetailsApi, updateStudentPhotoApi } from '../api';

type StudentFormData = {
    student_id: string;
    name: string;
    email: string;
    department: string;
};
const StudentForm: React.FC<{
    student?: Student | null;
    onSave: (studentData: StudentFormData, photoFiles: File[]) => void;
    onCancel: () => void;
    initialPhotoUrl?: string | null;
    isSaving: boolean;
}> = ({ student, onSave, onCancel, initialPhotoUrl, isSaving }) => {
    const [formData, setFormData] = useState({
        student_id: student?.student_id || '',
        name: student?.name || '',
        email: student?.email || '',
        department: student?.department || '',
    });
    const [photoFiles, setPhotoFiles] = useState<File[]>([]);
    const [photoPreview, setPhotoPreview] = useState<string | null>(student?.photo_url || initialPhotoUrl || null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    
    useEffect(() => {
        if (isCameraOpen && stream && videoRef.current) {
            videoRef.current.srcObject = stream;
        }
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isCameraOpen, stream]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files).slice(0, 5);
            setPhotoFiles(files);
            setPhotoPreview(URL.createObjectURL(files[0]));
        }
    };

    const handleOpenCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(mediaStream);
            setIsCameraOpen(true);
        } catch (err) {
            toast.error("Could not access camera. Please check permissions.");
        }
    };

    const handleCapturePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth || 640;
            canvas.height = videoRef.current.videoHeight || 480;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(blob => {
                    if (blob) {
                        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                            setPhotoFiles(prev => {
                                const next = [...prev, file].slice(0, 5);
                                return next;
                            });
                        setPhotoPreview(URL.createObjectURL(file));
                    }
                }, 'image/jpeg');
            }
            setIsCameraOpen(false);
            setStream(null);
        }
    };

    const handleRemovePhoto = (index: number) => {
        setPhotoFiles(prev => {
            const next = prev.filter((_, i) => i !== index);
            if (next.length === 0) {
                setPhotoPreview(null);
            } else {
                // Update preview to first remaining photo
                setPhotoPreview(URL.createObjectURL(next[0]));
            }
            return next;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData, photoFiles);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Form Inputs */}
            <input type="text" name="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Name" required className="w-full p-2 bg-background border border-border rounded-md" />
            <input type="text" name="student_id" value={formData.student_id} onChange={e => setFormData({...formData, student_id: e.target.value})} placeholder="Student ID" required className="w-full p-2 bg-background border border-border rounded-md" />
            <input type="email" name="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Email" required className="w-full p-2 bg-background border border-border rounded-md" />
            <input type="text" name="department" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} placeholder="Department" required className="w-full p-2 bg-background border border-border rounded-md" />
            
            {/* Photo Section */}
            <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                    Student Photos {photoFiles.length > 0 && `(selected: ${photoFiles.length}/5)`}
                </label>
                {isCameraOpen ? (
                    <div>
                         <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg mb-2 bg-black aspect-video object-cover border border-border"></video>
                         <div className="flex justify-center space-x-3">
                             <button type="button" onClick={handleCapturePhoto} className="flex-1 px-4 py-2 bg-primary text-white ...">Capture</button>
                             <button type="button" onClick={() => { setIsCameraOpen(false); setStream(null); }} className="flex-1 px-4 py-2 bg-slate-600 ...">Cancel</button>
                         </div>
                    </div>
                ) : (
                    <div className="flex items-center space-x-4">
                        {photoPreview ? <img src={photoPreview} alt="Preview" className="h-24 w-24 rounded-full object-cover" /> : <div className="h-24 w-24 rounded-full bg-background border border-border flex items-center justify-center"><UserIcon className="h-12 w-12 text-text-secondary"/></div>}
                        <div className="flex-1 space-y-2">
                             <label htmlFor="photo-upload" className="cursor-pointer w-full text-center px-4 py-2 ...">
                                 Upload Photo(s)
                             </label>
                             <input id="photo-upload" type="file" accept="image/*" multiple onChange={handlePhotoChange} className="hidden"/>
                             <button type="button" onClick={handleOpenCamera} className="w-full flex items-center justify-center ...">Take Photo</button>
                        </div>
                    </div>
                )}
                {photoFiles.length > 0 && (
                    <div className="mt-3 space-y-1">
                        <p className="text-xs text-text-secondary">
                            You can remove a specific photo below. The order here matches the backend (Photo 1, Photo 2, ...).
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {photoFiles.map((file, index) => (
                                <div key={index} className="relative">
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt={`Photo ${index + 1}`}
                                        className="h-16 w-16 rounded-md object-cover border border-border"
                                    />
                                    <span className="absolute bottom-1 left-1 text-[10px] px-1 py-[1px] rounded bg-black/60 text-white">
                                        #{index + 1}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemovePhoto(index)}
                                        className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center hover:bg-red-700"
                                        aria-label={`Remove photo ${index + 1}`}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-5 py-2 bg-slate-500 hover:bg-slate-600 ...">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-5 py-2 bg-primary hover:bg-primary/80 ...">
                    {isSaving ? 'Saving...' : (student ? 'Update Student' : 'Add Student')}
                </button>
            </div>
        </form>
    );
};

const StudentsPage: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchStudents = async () => {
        try {
            const data = await listStudents();
            setStudents(data);
        } catch (e) {
            toast.error("Failed to load students.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);
    
    const handleSaveStudent = async (studentData: StudentFormData, photoFiles: File[]) => {
        if (!editingStudent) {
            if (photoFiles.length < 5) {
                toast.warn("Please upload or capture 5 photos for better recognition accuracy.");
                return;
            }
        }
        setIsSaving(true);
        try {
            if (!editingStudent) {
                const form = new FormData();
                form.append('student_id', studentData.student_id);
                form.append('name', studentData.name);
                form.append('email', studentData.email);
                form.append('department', studentData.department);
                photoFiles.slice(0, 5).forEach(file => {
                    form.append('photos', file);
                });
                await createStudent(form);
            } else {
                // Update basic details
                await updateStudentDetailsApi(editingStudent.student_id, {
                    name: studentData.name,
                    email: studentData.email,
                    department: studentData.department,
                });
                // If user supplied new photos, update embeddings + profile picture
                if (photoFiles.length > 0) {
                    const photoForm = new FormData();
                    photoFiles.slice(0, 5).forEach(file => {
                        photoForm.append('photos', file);
                    });
                    await updateStudentPhotoApi(editingStudent.student_id, photoForm);
                }
            }
            await fetchStudents();
            closeModal();
            toast.success(`Student ${editingStudent ? 'updated' : 'added'} successfully!`);
        } catch (e) {
            if (e instanceof Error) {
                toast.error(e.message);
            } else {
                toast.error("Failed to save student.");
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteStudent = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;

        try {
            await deleteStudent(id);
            setStudents(currentStudents => currentStudents.filter(student => student.student_id !== id));
            toast.success(`Student "${name}" deleted successfully.`);
        } catch (error) {
            toast.error("Failed to delete student.");
        }
    };

    const openModal = (student: Student | null = null) => {
        setEditingStudent(student);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingStudent(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-text-primary">Manage Students</h1>
                <button onClick={() => openModal()} className="flex items-center gap-2 bg-primary text-white font-bold py-2 px-4 rounded-lg">
                    <PlusIcon className="h-5 w-5" />
                    <span>Add Student</span>
                </button>
            </div>

            {isLoading ? (
                <p>Loading students...</p>
            ) : students.length > 0 ? (
                <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                         <table className="min-w-full divide-y divide-border">
                             <thead className="bg-background">
                                 <tr>
                                     <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Photo</th>
                                     <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Name</th>
                                     <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Student ID</th>
                                     <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Department</th>
                                     <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Actions</th>
                                 </tr>
                             </thead>
                             <tbody className="bg-surface divide-y divide-border">
                                 {students.map(student => (
                                     <tr key={student.student_id} className="hover:bg-background">
                                         <td className="px-6 py-4"><img className="h-10 w-10 rounded-full object-cover" src={`http://localhost:8000${student.photo_url}`} alt={student.name}/></td>
                                         <td className="px-6 py-4 text-sm font-medium text-text-primary">{student.name}</td>
                                         <td className="px-6 py-4 text-sm text-text-secondary">{student.student_id}</td>
                                         <td className="px-6 py-4 text-sm text-text-secondary">{student.department}</td>
                                         <td className="px-6 py-4 text-sm font-medium space-x-2">
                                             <button onClick={() => openModal(student)} className="p-2 bg-yellow-500 hover:bg-yellow-600 rounded-full text-white"><PencilIcon className="h-4 w-4" /></button>
                                             <button onClick={() => handleDeleteStudent(student.student_id, student.name)} className="p-2 bg-red-500 hover:bg-red-600 rounded-full text-white"><TrashIcon className="h-4 w-4" /></button>
                                         </td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     </div>
                </div>
            ) : (
                <EmptyState
                    icon={<UserGroupIcon className="h-12 w-12 text-text-secondary" />}
                    title="No Students Found"
                    message="Get started by adding your first student to the system."
                    ctaText="Add Student"
                    onCtaClick={() => openModal()}
                />
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-surface p-8 rounded-xl w-full max-w-md border border-border relative">
                        <button onClick={closeModal} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary"><XMarkIcon className="h-6 w-6" /></button>
                        <h2 className="text-2xl font-bold mb-6 text-text-primary">{editingStudent ? 'Edit Student' : 'Add New Student'}</h2>
                        <StudentForm 
                            student={editingStudent} 
                            onSave={handleSaveStudent} 
                            onCancel={closeModal}
                            isSaving={isSaving} 
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentsPage;