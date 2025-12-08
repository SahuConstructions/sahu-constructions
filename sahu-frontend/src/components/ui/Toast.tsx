"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastProps {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
    onClose: (id: string) => void;
}

const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
};

const styles = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
};

export const Toast = ({ id, message, type, duration = 3000, onClose }: ToastProps) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => onClose(id), 300); // Wait for animation
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, id, onClose]);

    return (
        <div
            className={`flex items-center w-full max-w-sm p-4 mb-4 rounded-lg shadow-lg border transition-all duration-300 transform ${isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
                } ${styles[type]}`}
            role="alert"
        >
            <div className="flex-shrink-0">{icons[type]}</div>
            <div className="ml-3 text-sm font-medium flex-1">{message}</div>
            <button
                type="button"
                className={`ml-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 p-1.5 inline-flex h-8 w-8 hover:bg-black/5 transition-colors ${type === 'success' ? 'text-green-500 focus:ring-green-400' :
                        type === 'error' ? 'text-red-500 focus:ring-red-400' :
                            type === 'warning' ? 'text-amber-500 focus:ring-amber-400' :
                                'text-blue-500 focus:ring-blue-400'
                    }`}
                onClick={() => {
                    setIsVisible(false);
                    setTimeout(() => onClose(id), 300);
                }}
                aria-label="Close"
            >
                <span className="sr-only">Close</span>
                <X className="w-5 h-5" />
            </button>
        </div>
    );
};
