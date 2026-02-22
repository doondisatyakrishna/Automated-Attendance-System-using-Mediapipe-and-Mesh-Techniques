import React, { useState, useEffect, useMemo } from 'react';
import { getAnalyticsData, getTopLateStudents, getOverallAnalyticsData } from '../api';
import { toast } from 'react-toastify';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useTheme } from '../contexts/ThemeContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type AnalyticsData = {
    department: string;
    present_count: number;
    total_students: number;
    percentage: number;
};

type LateStudent = {
    student_id: string;
    name: string;
    department: string;
    late_count: number;
};

type OverallData = {
    present: number;
    late: number;
    absent: number;
};

type ViewType = 'department' | 'overall';

const AnalyticsPage: React.FC = () => {
    const { theme } = useTheme();
    const [view, setView] = useState<ViewType>('department');
    const [period, setPeriod] = useState<'7' | '30' | 'all'>('7');
    const [loading, setLoading] = useState(true);

    const [deptData, setDeptData] = useState<AnalyticsData[]>([]);
    const [overallData, setOverallData] = useState<OverallData | null>(null);
    const [lateStudents, setLateStudents] = useState<LateStudent[]>([]);

    // Helper to get current theme colors accurately
    const useChartColors = () => {
        const getCssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        // We use useMemo to avoid re-calculating on every render, only when theme changes
        return useMemo(() => ({
            textPrimary: getCssVar('--color-text-primary') || '#111827',
            textSecondary: getCssVar('--color-text-secondary') || '#6b7280',
            border: getCssVar('--color-border') || '#e5e7eb',
            primary: getCssVar('--color-primary') || '#0d9488',
            surface: getCssVar('--color-surface') || '#ffffff',
        }), [theme]);
    };

    const colors = useChartColors();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [deptResult, overallResult, topLateResult] = await Promise.all([
                    getAnalyticsData(period),
                    getOverallAnalyticsData(period),
                    getTopLateStudents(5)
                ]);
                setDeptData(deptResult);
                setOverallData(overallResult);
                setLateStudents(topLateResult);
            } catch (err) {
                console.error(err);
                toast.error('Failed to fetch complete analytics data.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [period]);

    // --- Chart Configurations ---
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 500 },
        scales: {
            x: {
                ticks: { color: colors.textSecondary, font: { weight: '500' as const } },
                grid: { display: false }
            },
            y: {
                beginAtZero: true,
                ticks: { color: colors.textSecondary },
                grid: { color: colors.border, drawBorder: false }
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: colors.textPrimary,
                titleColor: colors.surface,
                bodyColor: colors.surface,
                padding: 12,
                cornerRadius: 8,
            }
        }
    };

    // 1. Department Chart
    const deptChartData = {
        labels: deptData.map(d => d.department),
        datasets: [{
            label: 'Attendance Rate (%)',
            data: deptData.map(d => d.percentage),
            backgroundColor: `${colors.primary}D9`, // 85% opacity
            hoverBackgroundColor: colors.primary,
            borderRadius: 6,
            borderSkipped: false as const,
        }],
    };

    const deptChartOptions = {
        ...commonOptions,
        plugins: {
            ...commonOptions.plugins,
            title: {
                display: true,
                text: 'Attendance Rate by Department (%)',
                color: colors.textPrimary,
                font: { size: 16, weight: 'bold' as const },
                padding: { bottom: 20 }
            }
        },
        scales: {
            ...commonOptions.scales,
            y: {
                ...commonOptions.scales.y,
                max: 100,
                ticks: { color: colors.textSecondary, callback: (v: any) => v + '%' }
            }
        }
    };

    // 2. Overall Chart
    const overallChartData = {
        labels: ['Present', 'Late', 'Absent'],
        datasets: [{
            label: 'Total Records',
            data: overallData ? [overallData.present, overallData.late, overallData.absent] : [0, 0, 0],
            backgroundColor: [
                'rgba(16, 185, 129, 0.85)', // Emerald
                'rgba(245, 158, 11, 0.85)', // Amber
                'rgba(239, 68, 68, 0.85)',  // Red
            ],
            hoverBackgroundColor: [
                'rgb(16, 185, 129)',
                'rgb(245, 158, 11)',
                'rgb(239, 68, 68)',
            ],
            borderRadius: 6,
            borderSkipped: false as const,
        }],
    };

    const overallChartOptions = {
        ...commonOptions,
        plugins: {
            ...commonOptions.plugins,
            title: {
                display: true,
                text: 'Overall Attendance Status (Total Count)',
                color: colors.textPrimary,
                font: { size: 16, weight: 'bold' as const },
                padding: { bottom: 20 }
            }
        }
    };

    // Unique key to force re-render on theme/view change
    const chartKey = `${theme}-${period}-${view}`;

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Analytics</h1>
                    <p className="text-text-secondary">Real-time attendance insights.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                     {/* View Toggle */}
                    <div className="flex p-1 bg-surface border border-border rounded-xl">
                        <button onClick={() => setView('department')} className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${view === 'department' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>
                            Department
                        </button>
                        <button onClick={() => setView('overall')} className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${view === 'overall' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>
                            Overall
                        </button>
                    </div>
                    {/* Period Toggle */}
                    <div className="flex p-1 bg-surface border border-border rounded-xl">
                        {(['7', '30', 'all'] as const).map(p => (
                            <button key={p} onClick={() => setPeriod(p)} className={`flex-1 px-3 py-2 text-sm font-semibold rounded-lg transition-all ${period === p ? 'bg-background text-primary shadow-sm border border-border/50' : 'text-text-secondary hover:text-text-primary'}`}>
                                {p === 'all' ? 'All' : `${p}D`}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Chart */}
            <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border h-[450px] relative">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-surface/50 backdrop-blur-sm rounded-2xl z-10">
                        <div className="animate-pulse text-primary font-semibold">Loading data...</div>
                    </div>
                )}
                {view === 'department' ? (
                    <Bar key={chartKey} options={deptChartOptions as any} data={deptChartData} />
                ) : (
                    <Bar key={chartKey} options={overallChartOptions as any} data={overallChartData} />
                )}
            </div>

            {/* Top Late Students */}
            <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border">
                <h2 className="text-xl font-bold text-text-primary mb-4">Frequent Late Arrivals <span className="text-sm font-normal text-text-tertiary ml-2">(Top 5)</span></h2>
                {lateStudents.length === 0 ? (
                     <div className="text-center py-6 text-text-secondary bg-background/50 rounded-xl border border-border/50 dashed-border">
                        No late records found for this period.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-xs font-semibold text-text-tertiary uppercase tracking-wider border-b border-border">
                                    <th className="px-4 py-3">Student</th>
                                    <th className="px-4 py-3">Department</th>
                                    <th className="px-4 py-3 text-right">Late Count</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {lateStudents.map((student, index) => (
                                    <tr key={student.student_id} className="hover:bg-background/30 transition-colors">
                                        <td className="px-4 py-3 font-medium text-text-primary">
                                            <span className="text-text-tertiary mr-2">{index + 1}.</span> {student.name}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-text-secondary">{student.department}</td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="inline-block px-2 py-1 text-xs font-bold text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-500 rounded-full">
                                                {student.late_count}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalyticsPage;