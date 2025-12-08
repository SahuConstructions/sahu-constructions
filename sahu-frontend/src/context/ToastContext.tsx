"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Toast, ToastType } from "@/components/ui/Toast";

interface ToastContextType {
    addToast: (message: string, type: ToastType, duration?: number) => void;
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
    const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: ToastType; duration?: number }>>([]);

    const addToast = useCallback((message: string, type: ToastType, duration = 3000) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type, duration }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const success = useCallback((message: string, duration?: number) => addToast(message, "success", duration), [addToast]);
    const error = useCallback((message: string, duration?: number) => addToast(message, "error", duration), [addToast]);
    const warning = useCallback((message: string, duration?: number) => addToast(message, "warning", duration), [addToast]);
    const info = useCallback((message: string, duration?: number) => addToast(message, "info", duration), [addToast]);

    return (
        <ToastContext.Provider value={{ addToast, success, error, warning, info }}>
            {children}
            <div className="fixed top-5 right-5 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
                <div className="pointer-events-auto">
                    {toasts.map((toast) => (
                        <Toast
                            key={toast.id}
                            id={toast.id}
                            message={toast.message}
                            type={toast.type}
                            duration={toast.duration}
                            onClose={removeToast}
                        />
                    ))}
                </div>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
};
