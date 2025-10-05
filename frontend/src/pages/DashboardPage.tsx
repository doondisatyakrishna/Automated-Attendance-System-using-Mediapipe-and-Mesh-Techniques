import React, { useState, useEffect } from 'react';
import { getDashboardSummary } from '../api';
import { StatData, LogEntry } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { EmptyState } from '../components/EmptyState';
import { 
    UserGroupIcon, 
    CheckCircleIcon, 
    XCircleIcon, 
    ClockIcon, 
    ClipboardDocumentListIcon 
} from '@heroicons/react/24/solid';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const StatCard = ({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) => (
    <div className="bg-surface p-4 rounded-xl border border-border shadow-sm flex flex-col items-center justify-center text-center transition-all hover:shadow-md hover:-translate-y-1">
        <div className="mb-2">{icon}</div>
        <p className="text-2xl font-bold text-text-primary">{value}</p>
        <p className="text-xs font-medium text-text-secondary">{title}</p>
    </div>
);

const DashboardPage: React.FC = () => {
    const [stats, setStats] = useState<StatData | null>(null);
    const [log, setLog] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const { theme } = useTheme();
    const [chartColors, setChartColors] = useState({ present: '#10b981', late: '#f59e0b', absent: '#ef4444' });

    useEffect(() => {
        const updateChartColors = () => {
            const rootStyles = getComputedStyle(document.documentElement);
            setChartColors({
                present: rootStyles.getPropertyValue('--color-primary').trim() || '#10b981',
                late: '#f59e0b',
                absent: '#ef4444',
            });
        };
        updateChartColors();
    }, [theme]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await getDashboardSummary();
                setStats(data.stats);
                setLog(data.log);
            } catch (error) {
                console.error("Failed to fetch dashboard summary:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const chartData = [
        { name: 'Present', value: stats?.present || 0 },
        { name: 'Late', value: stats?.late || 0 },
        { name: 'Absent', value: stats?.absent || 0 },
    ];
    const COLORS = [chartColors.present, chartColors.late, chartColors.absent];

    const getStatusPill = (status: 'present' | 'absent' | 'late') => {
        const styles = {
            present: 'bg-primary/10 text-primary',
            late: 'bg-yellow-500/10 text-yellow-600',
            absent: 'bg-red-500/10 text-red-600'
        };
        return <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
    };

    if (loading) return <div className="flex justify-center items-center h-64"><p className="animate-pulse">Loading Dashboard...</p></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
                <p className="text-text-secondary">Today's attendance at a glance.</p>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Students" value={stats?.total || 0} icon={<UserGroupIcon className="h-7 w-7 text-primary" />} />
                <StatCard title="Present" value={stats?.present || 0} icon={<CheckCircleIcon className="h-7 w-7 text-green-500" />} />
                <StatCard title="Late" value={stats?.late || 0} icon={<ClockIcon className="h-7 w-7 text-yellow-500" />} />
                <StatCard title="Absent" value={stats?.absent || 0} icon={<XCircleIcon className="h-7 w-7 text-red-500" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-surface p-6 rounded-xl border border-border">
                    <h2 className="text-lg font-semibold text-text-primary mb-4">Attendance Log - Today</h2>
                    {log.length > 0 ? (
                        <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3">
                            {log.map(entry => (
                                <div key={entry.student_id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                                    <div className="flex items-center gap-3">
                                        {entry.photo_url ? (
                                            <img src={`http://localhost:8000${entry.photo_url}`} alt={entry.name} className="h-10 w-10 rounded-full object-cover"/>
                                        ) : (
                                            <div className="h-10 w-10 bg-background rounded-full flex items-center justify-center border border-border"><UserGroupIcon className="h-6 w-6 text-text-secondary"/></div>
                                        )}
                                        <div>
                                            <p className="font-medium text-text-primary">{entry.name}</p>
                                            <p className="text-sm text-text-secondary">
    {entry.check_in_time
        ? `Checked in at ${new Date(entry.check_in_time).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })}`
        : 'Not checked in'
    }
</p>
                                        </div>
                                    </div>
                                    {getStatusPill(entry.status)}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={<ClipboardDocumentListIcon className="h-8 w-8 text-text-secondary" />}
                            title="No Activity Yet Today"
                            message="Attendance records will appear here as students are recognized."
                        />
                    )}
                </div>

                <div className="lg:col-span-2 bg-surface p-6 rounded-xl border border-border">
                    <h2 className="text-lg font-semibold text-text-primary mb-4">Daily Summary</h2>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={90} fill="#8884d8" paddingAngle={5} labelLine={false}>
                                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip wrapperStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '0.75rem' }} />
                                <Legend iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;