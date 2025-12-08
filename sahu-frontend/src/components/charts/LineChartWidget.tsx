"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

interface LineConfig {
    key: string;
    color: string;
    name: string;
}

interface LineChartWidgetProps {
    data: Array<{ [key: string]: any }>;
    xKey: string;
    lines: LineConfig[];
    title: string;
    height?: number;
}

export default function LineChartWidget({
    data,
    xKey,
    lines,
    title,
    height = 300,
}: LineChartWidgetProps) {
    return (
        <div className="w-full">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
            <ResponsiveContainer width="100%" height={height}>
                <LineChart data={data}>
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
                        iconType="line"
                    />
                    {lines.map((line) => (
                        <Line
                            key={line.key}
                            type="monotone"
                            dataKey={line.key}
                            stroke={line.color}
                            strokeWidth={2}
                            name={line.name}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
