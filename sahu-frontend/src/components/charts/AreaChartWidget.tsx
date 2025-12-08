"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";

interface AreaChartWidgetProps {
    data: Array<{ [key: string]: any }>;
    xKey: string;
    yKeys: string[];
    title: string;
    colors?: string[];
    height?: number;
}

export default function AreaChartWidget({
    data,
    xKey,
    yKeys,
    title,
    colors = ["#3b82f6", "#10b981", "#f59e0b"],
    height = 300,
}: AreaChartWidgetProps) {
    return (
        <div className="w-full">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
            <ResponsiveContainer width="100%" height={height}>
                <AreaChart data={data}>
                    <defs>
                        {yKeys.map((key, index) => (
                            <linearGradient
                                key={key}
                                id={`color${key}`}
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor={colors[index % colors.length]}
                                    stopOpacity={0.8}
                                />
                                <stop
                                    offset="95%"
                                    stopColor={colors[index % colors.length]}
                                    stopOpacity={0.1}
                                />
                            </linearGradient>
                        ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        dataKey={xKey}
                        tick={{ fontSize: 12 }}
                        stroke="#6b7280"
                    />
                    <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#fff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            padding: "8px 12px",
                        }}
                    />
                    <Legend
                        wrapperStyle={{ fontSize: "12px" }}
                        iconType="circle"
                    />
                    {yKeys.map((key, index) => (
                        <Area
                            key={key}
                            type="monotone"
                            dataKey={key}
                            stroke={colors[index % colors.length]}
                            fillOpacity={1}
                            fill={`url(#color${key})`}
                            strokeWidth={2}
                        />
                    ))}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
