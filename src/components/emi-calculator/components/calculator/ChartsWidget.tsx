import React, { useMemo } from 'react';
import { useEmi } from '../../context/EmiContext';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Download } from 'lucide-react';
import { clsx } from 'clsx';

const ChartsWidget = () => {
    const { amount, totalPayment, totalInterest, months, emi, formatCurrency, yearlySchedule } = useEmi();

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PieChartWidget
                    amount={amount}
                    totalPayment={totalPayment}
                    totalInterest={totalInterest}
                    formatCurrency={formatCurrency}
                />
                <BarChartWidget
                    months={months}
                    emi={emi}
                    yearlySchedule={yearlySchedule}
                    formatCurrency={formatCurrency}
                />
            </div>
        </div>
    );
};

interface PieChartWidgetProps {
    amount: number;
    totalPayment: number;
    totalInterest: number;
    formatCurrency: (val: number) => string;
}

const PieChartWidget: React.FC<PieChartWidgetProps> = ({ amount, totalPayment, totalInterest, formatCurrency }) => {
    const data = [
        { name: 'Principal', value: amount, color: '#42a5f5' },
        { name: 'Interest', value: totalInterest, color: '#ef5350' },
    ];

    const interestPercentage = totalPayment > 0 ? (totalInterest / totalPayment) * 100 : 0;
    const principalPercentage = totalPayment > 0 ? (amount / totalPayment) * 100 : 0;

    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const RADIAN = Math.PI / 180;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-bold">
                {`${(percent * 100).toFixed(1)}%`}
            </text>
        );
    };

    return (
        <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-6 font-mono tracking-tight">Payment Breakdown</h3>
            <div className="h-64 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={110}
                            paddingAngle={0}
                            dataKey="value"
                            startAngle={90}
                            endAngle={450}
                            labelLine={false}
                            label={renderCustomizedLabel}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: any) => `₹${formatCurrency(value || 0)}`}
                            position={((coordinate: any, event: any, element: any, view: any) => {
                                if (!view || !view.width || !view.height || !coordinate) return coordinate;
                                const cx = view.width / 2;
                                const cy = view.height / 2;
                                const dx = coordinate.x - cx;
                                const dy = coordinate.y - cy;
                                const angle = Math.atan2(dy, dx);
                                const radius = 135; // Increased radius

                                let x = cx + radius * Math.cos(angle);
                                let y = cy + radius * Math.sin(angle);

                                // Estimated tooltip dimensions (generous)
                                const tooltipWidth = 180;
                                const tooltipHeight = 100;

                                // Shift if on the left half
                                if (x < cx) {
                                    x -= tooltipWidth;
                                }

                                // Shift if on the top half
                                if (y < cy) {
                                    y -= tooltipHeight;
                                }

                                return { x, y };
                            }) as any}
                            allowEscapeViewBox={{ x: true, y: true }}
                        />
                    </PieChart>
                </ResponsiveContainer>

                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs text-gray-400 font-bold">Total</span>
                    <span className="text-sm font-black text-gray-800">₹{formatCurrency(totalPayment)}</span>
                </div>
            </div>

            <div className="flex justify-center space-x-12 mt-6">
                <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-sm bg-[#ef5350]"></div>
                    <span className="text-xs font-bold text-gray-500">Interest: {interestPercentage.toFixed(1)}%</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-sm bg-[#42a5f5]"></div>
                    <span className="text-xs font-bold text-gray-500">Principal: {principalPercentage.toFixed(1)}%</span>
                </div>
            </div>
        </div>
    );
};

interface BarChartWidgetProps {
    months: number;
    emi: number;
    yearlySchedule: any[];
    formatCurrency: (val: number) => string;
}

const BarChartWidget: React.FC<BarChartWidgetProps> = ({ months, emi, yearlySchedule, formatCurrency }) => {
    const [barSize, setBarSize] = React.useState(32);

    React.useEffect(() => {
        const updateBarSize = () => {
            setBarSize(window.innerWidth <= 320 ? 20 : 32);
        };

        updateBarSize();
        window.addEventListener('resize', updateBarSize);
        return () => window.removeEventListener('resize', updateBarSize);
    }, []);

    const data = useMemo(() => {
        // Use yearlySchedule if available, otherwise fallback
        if (yearlySchedule && yearlySchedule.length > 0) {
            return yearlySchedule.map((row) => ({
                name: `Y${row.month}`,
                amount: row.emi,
                cpf: row.cpf,
                cgf: row.cgf,
                fill: (row.month - 1) % 2 === 0 ? '#42a5f5' : '#009688'
            }));
        }

        const years = Math.ceil(months / 12);
        const chartData = [];

        for (let i = 0; i < years; i++) {
            const monthsInYear = Math.min(12, months - (i * 12));
            const yearlyTotal = emi * monthsInYear;

            chartData.push({
                name: `Y${i + 1}`,
                amount: yearlyTotal,
                cpf: 0,
                cgf: 0,
                fill: i % 2 === 0 ? '#42a5f5' : '#009688'
            });
        }
        return chartData;
    }, [months, emi, yearlySchedule]);

    const formatCompact = (value: number) => {
        if (value >= 100000) return (value / 100000).toFixed(1) + 'L';
        if (value >= 1000) return (value / 1000).toFixed(0) + 'k';
        return String(value);
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-3 border border-gray-100 shadow-md rounded-xl text-left">
                    <p className="text-gray-500 text-xs font-bold mb-1">{label}</p>
                    <div className="space-y-0.5">
                        <p className="text-sm font-bold text-gray-800">
                            Payment : <span className="font-mono">₹{formatCurrency(data.amount)}</span>
                        </p>
                        {data.cpf > 0 && (
                            <p className="text-xs font-semibold text-gray-600">
                                CPF : <span className="font-mono">₹{formatCurrency(data.cpf)}</span>
                            </p>
                        )}
                        {data.cgf > 0 && (
                            <p className="text-xs font-semibold text-gray-600">
                                CGF : <span className="font-mono">₹{formatCurrency(data.cgf)}</span>
                            </p>
                        )}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-6 font-mono tracking-tight">Yearly Overview</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="5 5" stroke="#e5e7eb" vertical={true} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#4b5563', fontWeight: 'bold' }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'semibold' }}
                            tickFormatter={formatCompact}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                        <Bar
                            dataKey="amount"
                            radius={[8, 8, 0, 0]}
                            barSize={barSize}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ChartsWidget;

