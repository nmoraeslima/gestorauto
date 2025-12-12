import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import {
    DurationUnit,
    minutesToBestUnit,
    toMinutes,
    getUnitLabel,
    getStepForUnit,
    getMinForUnit,
    formatDuration
} from '@/utils/duration';

interface DurationInputProps {
    /** Current duration in minutes */
    value: number;
    /** Callback when duration changes (in minutes) */
    onChange: (minutes: number) => void;
    /** Label for the input */
    label?: string;
    /** Whether the field is required */
    required?: boolean;
    /** Additional CSS classes */
    className?: string;
}

/**
 * DurationInput Component
 * Allows users to input duration in minutes, hours, or days
 * Automatically converts to minutes for storage
 */
export const DurationInput: React.FC<DurationInputProps> = ({
    value,
    onChange,
    label = 'Duração',
    required = false,
    className = '',
}) => {
    // Convert initial minutes to best unit
    const initialDuration = minutesToBestUnit(value);

    const [durationValue, setDurationValue] = useState<number>(initialDuration.value);
    const [durationUnit, setDurationUnit] = useState<DurationUnit>(initialDuration.unit);

    // Update local state when external value changes
    useEffect(() => {
        const newDuration = minutesToBestUnit(value);
        setDurationValue(newDuration.value);
        setDurationUnit(newDuration.unit);
    }, [value]);

    // Handle value change
    const handleValueChange = (newValue: number) => {
        setDurationValue(newValue);
        const minutes = toMinutes(newValue, durationUnit);
        onChange(minutes);
    };

    // Handle unit change
    const handleUnitChange = (newUnit: DurationUnit) => {
        setDurationUnit(newUnit);
        const minutes = toMinutes(durationValue, newUnit);
        onChange(minutes);
    };

    const totalMinutes = toMinutes(durationValue, durationUnit);
    const formattedDuration = formatDuration(totalMinutes);

    return (
        <div className={className}>
            <label className="label">
                <Clock className="w-4 h-4 inline mr-2" />
                {label} {required && '*'}
            </label>

            <div className="flex gap-2">
                {/* Value Input */}
                <input
                    type="number"
                    required={required}
                    min={getMinForUnit(durationUnit)}
                    step={getStepForUnit(durationUnit)}
                    value={durationValue}
                    onChange={(e) => handleValueChange(parseFloat(e.target.value) || 0)}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="input flex-1"
                    placeholder="0"
                    autoComplete="off"
                />

                {/* Unit Selector */}
                <select
                    value={durationUnit}
                    onChange={(e) => handleUnitChange(e.target.value as DurationUnit)}
                    className="input w-32"
                >
                    <option value="minutes">{getUnitLabel('minutes')}</option>
                    <option value="hours">{getUnitLabel('hours')}</option>
                    <option value="days">{getUnitLabel('days')}</option>
                </select>
            </div>

            {/* Helper Text */}
            <p className="text-xs text-gray-500 mt-1">
                Total: {formattedDuration} ({totalMinutes} min)
            </p>
        </div>
    );
};
