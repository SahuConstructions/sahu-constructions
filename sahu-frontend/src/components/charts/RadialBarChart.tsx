"use client";

import { RadialBarChart as RechartsRadialBarChart, RadialBar, ResponsiveContainer } from "recharts";

interface RadialBarChartProps {
    value: number;
    maxValue: number;
    label: string;
    subtitle?: string;
    color?: string;
}

export default function RadialBarChart({
    value,
    maxValue,
    label,
    subtitle,
    color = "#3b82f6",
}: RadialBarChartProps) {
    const percentage = Math.round((value / maxValue) * 100);
    const data = [{ name: label, value: percentage, fill: color }];

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-40 h-40">
                <ResponsiveContainer width="100%" height="100%">
                    <RechartsRadialBarChart
                        cx="50%"
                        cy="50%"
                        innerRadius="60%"
                        outerRadius="90%"
                        barSize={12}
                        data={data}
                        startAngle={90}
                        endAngle={-270}
                    >
                        <RadialBar
                            background
                            dataKey="value"
                            cornerRadius={10}
                            animationBegin={0}
                            animationDuration={800}
                        />
                    </RechartsRadialBarChart>
                </ResponsiveContainer>

                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-2xl font-bold text-gray-800">
                        {percentage}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        {value}/{maxValue}
                    </div>
                </div>
            </div>

            <div className="text-center mt-2">
                <div className="text-sm font-semibold text-gray-800">{label}</div>
                {subtitle && (
                    <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>
                )}
            </div>
        </div>
    );
}
