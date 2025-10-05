import React, { useState, useEffect } from 'react';
import { getAnalyticsData } from '../api';
import { toast } from 'react-toastify';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useTheme } from '../contexts/ThemeContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type AnalyticsData = {
    department: string;
    present_count: number;
    total_students: number;
    percentage: number;
};

const AnalyticsPage: React.FC = () => {
    const [data, setData] = useState<AnalyticsData[]>([]);
    const [period, setPeriod] = useState<'7' | '30' | 'all'>('7');
    const [loading, setLoading] = useState(true);
    const { theme } = useTheme();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const result = await getAnalyticsData(period);
                setData(result);
            } catch (err) {
                toast.error('Failed to fetch analytics data.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [period]);

    const chartData = {
        labels: data.map(d => d.department),
        datasets: [
            {
                label: 'Attendance Percentage',
                data: data.map(d => d.percentage),
                backgroundColor: 'rgba(var(--color-primary-rgb), 0.6)', // Using a CSS variable
                borderColor: 'rgba(var(--color-primary-rgb), 1)',
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: { color: 'var(--color-text-secondary)' }
            },
            title: {
                display: true,
                text: `Department Attendance Rate (%)`,
                color: 'var(--color-text-primary)',
                font: { size: 18 }
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                ticks: { 
                    color: 'var(--color-text-secondary)',
                    callback: function(value: any) { return value + '%'; }
                },
                grid: { color: 'var(--color-border)' }
            },
            x: {
                ticks: { color: 'var(--color-text-secondary)' },
                grid: { color: 'transparent' }
            }
        }
    };
    
    // We need to pass the theme key to re-render the chart when the theme changes
    // Chart.js doesn't automatically re-read CSS variables
    const chartKey = `${theme}-${period}`;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-text-primary">Attendance Analytics</h1>
                <div className="flex items-center space-x-2 p-1 bg-background rounded-xl border border-border">
                    {(['7', '30', 'all'] as const).map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${period === p ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-surface'}`}
                        >
                            {p === 'all' ? 'Overall' : `Last ${p} Days`}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-surface p-6 rounded-xl shadow-sm border border-border h-96">
                {loading ? (
                    <p>Loading chart...</p>
                ) : (
                    <Bar key={chartKey} options={chartOptions} data={chartData} />
                )}
            </div>
        </div>
    );
};

export default AnalyticsPage;