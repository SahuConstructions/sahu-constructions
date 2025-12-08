"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface DonutChartProps {
    percentage: number;
    label: string;
    subtitle?: string;
    color?: string;
    size?: number;
}

export default function DonutChart({
    percentage,
    label,
    subtitle,
    color = "#3b82f6",
    size = 180,
}: DonutChartProps) {
    const data = [
        { name: "Completed", value: percentage },
        { name: "Remaining", value: 100 - percentage },
    ];

    const COLORS = [color, "#e5e7eb"];

    return (
        <div className="flex flex-col items-center justify-center">
            <div className="relative" style={{ width: size, height: size }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={size * 0.6 / 2}
                            outerRadius={size * 0.85 / 2}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                            animationBegin={0}
                            animationDuration={800}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index]} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>

                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-3xl font-bold" style={{ color }}>
                        {percentage}%
                    </div>
                </div>
            </div>

            <div className="text-center mt-3">
                <div className="text-sm font-semibold text-gray-800">{label}</div>
                {subtitle && (
                    <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
                )}
            </div>
        </div>
    );
}
