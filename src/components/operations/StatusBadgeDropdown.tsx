import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';

interface StatusBadgeDropdownProps {
    currentStatus: string;
    onStatusChange: (newStatus: string) => void;
    disabled?: boolean;
    align?: 'left' | 'right';
}

export const StatusBadgeDropdown: React.FC<StatusBadgeDropdownProps> = ({
    currentStatus,
    onStatusChange,
    disabled = false,
    align = 'left'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const statuses = [
        { value: 'draft', label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
        { value: 'in_progress', label: 'Em Andamento', color: 'bg-blue-100 text-blue-800 border-blue-200' },
        { value: 'completed', label: 'Concluído', color: 'bg-green-100 text-green-800 border-green-200' },
        { value: 'cancelled', label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-200' }
    ];

    const currentStatusConfig = statuses.find(s => s.value === currentStatus) || statuses[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleSelect = (status: string) => {
        onStatusChange(status);
        setIsOpen(false);
    };

    return (
        <div className="relative inline-block" ref={dropdownRef}>
            <button
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`
                    px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 transition-all
                    ${currentStatusConfig.color}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-95 cursor-pointer'}
                `}
                disabled={disabled}
            >
                {currentStatusConfig.label}
                {!disabled && <ChevronDown className="w-3 h-3 ml-1" />}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 z-50 overflow-hidden`}
                    >
                        <div className="py-1">
                            {statuses.map((status) => (
                                <button
                                    key={status.value}
                                    onClick={() => handleSelect(status.value)}
                                    className={`
                                        w-full text-left px-4 py-2 text-sm flex items-center justify-between
                                        hover:bg-neutral-50 transition-colors
                                        ${currentStatus === status.value ? 'bg-primary-50 text-primary-700 font-medium' : 'text-neutral-700'}
                                    `}
                                >
                                    <span className={`px-2 py-0.5 rounded text-xs ${status.color.split(' ')[0]} ${status.color.split(' ')[1]}`}>
                                        {status.label}
                                    </span>
                                    {currentStatus === status.value && (
                                        <Check className="w-4 h-4 text-primary-600" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
