import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { UserIcon, VideoCameraIcon, VideoCameraSlashIcon } from '@heroicons/react/24/solid';
import { recognizeImage, getTodaysAttendance } from '../api'; 
import { EmptyState } from '../components/EmptyState';
import { LogEntry } from '../types';

const CameraFeed: React.FC<{ onStudentRecognized: (student: any) => void; isCameraActive: boolean; setIsCameraActive: (isActive: boolean) => void; }> = ({ onStudentRecognized, isCameraActive, setIsCameraActive }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const intervalRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const startCamera = async () => {
        try {
            if (streamRef.current) return;
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) videoRef.current.srcObject = stream;
            streamRef.current = stream;
            intervalRef.current = window.setInterval(recognize, 3000);
            setIsCameraActive(true);
            toast.info("Camera started. Recognition is active.", { autoClose: 1500 });
        } catch (err) {
            toast.error("Could not access camera. Please check permissions.", { autoClose: 1500 });
        }
    };

    const stopCamera = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
            if (videoRef.current) videoRef.current.srcObject = null;
            setIsCameraActive(false);
            if (isCameraActive) toast.info("Camera stopped.", { autoClose: 1500 });
        }
    };

    const recognize = async () => {
        if (!videoRef.current?.srcObject) return;

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 1. Capture a single frame
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        // 2. Convert the single frame to a File
        const imageFile = await new Promise<File | null>((resolve) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], 'frame.jpg', { type: 'image/jpeg' });
                    resolve(file);
                } else {
                    resolve(null);
                }
            }, 'image/jpeg');
        });

        if (!imageFile) {
            toast.error("Could not capture frame from camera.", { autoClose: 1000 });
            return;
        }

        try {
            // 3. Create FormData and append the single file with the key 'file'
            const form = new FormData();
            form.append('file', imageFile);

            const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/recognition/recognize`, {
                method: 'POST',
                body: form,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.detail || 'Recognition failed');
            }

            const result = await res.json();
            if (result.status === 'match_found') {
                onStudentRecognized(result);
            }
        } catch (e: any) {
            if (e.message && e.message.includes('Liveness check failed')) {
                toast.error('Liveness check failed. Image appears to be a photo or screen.', { autoClose: 1500 });
            } else if (e.message) {
                toast.error(e.message, { autoClose: 1500 });
            }
        }
    };

    useEffect(() => stopCamera, []);

    return (
        <div className="bg-surface p-6 rounded-xl shadow-sm border border-border">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-text-primary">Live Camera Feed</h2>
                <span className={`flex items-center text-xs font-bold uppercase tracking-wider ${isCameraActive ? 'text-green-500' : 'text-red-500'}`}>
                    <span className={`w-2 h-2 rounded-full mr-2 ${isCameraActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                    {isCameraActive ? 'Active' : 'Inactive'}
                </span>
            </div>
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-border">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            </div>
            <div className="mt-4 flex justify-center space-x-4">
                <button onClick={startCamera} disabled={isCameraActive} className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-5 rounded-lg transition disabled:bg-slate-400 disabled:cursor-not-allowed">
                    <VideoCameraIcon className="h-5 w-5" /><span>Start Camera</span>
                </button>
                <button onClick={stopCamera} disabled={!isCameraActive} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-5 rounded-lg transition disabled:bg-slate-400 disabled:cursor-not-allowed">
                    <VideoCameraSlashIcon className="h-5 w-5" /><span>Stop Camera</span>
                </button>
            </div>
        </div>
    );
};

const TakeAttendancePage: React.FC = () => {
    const [todaysLog, setTodaysLog] = useState<LogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const fetchInitialLog = async () => {
            try {
                const logData = await getTodaysAttendance();
                setTodaysLog(logData);
            } catch (error) {
                console.error("Error fetching today's attendance:", error);
                toast.error("Could not load today's attendance log.", { autoClose: 1500 });
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialLog();
    }, []);

    const handleStudentRecognized = async (recognizedStudent: any) => {
        if (isProcessing) return;
        setIsProcessing(true);

        try {
            const studentId = recognizedStudent.student_id;
            const alreadyMarked = todaysLog.some(entry => entry.student_id === studentId && (entry.status === 'present' || entry.status === 'late'));

            if (alreadyMarked) {
                toast.info(`${recognizedStudent.name} is already marked present.`, { autoClose: 1500 });
                setIsProcessing(false);
                return;
            }
            
            const tempRecord: LogEntry = {
                student_id: studentId,
                name: recognizedStudent.name,
                photo_url: recognizedStudent.photo_url || (todaysLog.find(s => s.student_id === studentId)?.photo_url || ''),
                status: new Date().getHours() >= 12 ? 'late' : 'present',
                timestamp: new Date().toISOString(),
            };

            setTodaysLog(prevLog => [tempRecord, ...prevLog.filter(e => e.student_id !== studentId)]);

            toast.success(`${recognizedStudent.name} marked ${tempRecord.status}!`, {
                autoClose: 1500,
                onClose: async () => {
                    await new Promise(res => setTimeout(res, 1000));
                    try {
                        const updatedLog = await getTodaysAttendance();
                        setTodaysLog(updatedLog);
                    } catch (err) {
                        console.error("Error refreshing attendance log:", err);
                    } finally {
                        setIsProcessing(false);
                    }
                }
            });
        } catch (err) {
            console.error("Error updating attendance:", err);
            setIsProcessing(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <CameraFeed 
                    onStudentRecognized={handleStudentRecognized} 
                    isCameraActive={isCameraActive}
                    setIsCameraActive={setIsCameraActive}
                />
            </div>

            <div className="bg-surface p-6 rounded-xl shadow-sm border border-border">
                <h2 className="text-lg font-semibold text-text-primary mb-4">
                    Recognized Today ({todaysLog.length})
                </h2>

                {isLoading ? (
                    <p className="text-text-secondary text-center p-4">Loading log...</p>
                ) : (
                    <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-3">
                        {todaysLog.length > 0 ? todaysLog.map((entry) => (
                            <div
                                key={entry.student_id + entry.timestamp}
                                className="flex items-center justify-between p-3 bg-background rounded-lg animate-fade-in-down"
                            >
                                <div className="flex items-center gap-3">
                                    {entry.photo_url ? (
                                        <img
                                            src={`http://localhost:8000${entry.photo_url}`}
                                            alt={entry.name}
                                            className="h-10 w-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-10 w-10 rounded-full bg-background border border-border flex items-center justify-center">
                                            <UserIcon className="h-6 w-6 text-text-secondary" />
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-medium text-text-primary">{entry.name}</p>
                                        <p className="text-sm text-text-secondary">
                                            {entry.timestamp
                                                ? new Date(entry.timestamp).toLocaleTimeString('en-IN', {
                                                    timeZone: 'Asia/Kolkata',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    hour12: true
                                                })
                                                : '---'}
                                        </p>
                                    </div>
                                </div>
                                <span
                                    className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                                        entry.status === 'late'
                                            ? 'bg-yellow-500/10 text-yellow-600'
                                            : 'bg-primary/10 text-primary'
                                    }`}
                                >
                                    {entry.status}
                                </span>
                            </div>
                        )) : (
                            <EmptyState
                                icon={<UserIcon className="h-12 w-12 text-text-secondary" />}
                                title="No Students Recognized Yet"
                                message="Start the camera to begin marking attendance for today."
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TakeAttendancePage;  