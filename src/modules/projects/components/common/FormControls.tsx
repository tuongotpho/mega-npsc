
import React, { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon } from '../../../../shared/components/Icons.tsx';

export const MultiSelectCheckbox: React.FC<{
    label: string;
    options: { value: string; label: string; }[];
    selectedValues: string[];
    onChange: (selected: string[]) => void;
    name: string;
}> = ({ label, options, selectedValues, onChange, name }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    const handleSelect = (value: string) => {
        const newSelection = selectedValues.includes(value)
            ? selectedValues.filter(v => v !== value)
            : [...selectedValues, value];
        onChange(newSelection);
    };

    const selectedLabels = options
        .filter(opt => selectedValues.includes(opt.value))
        .map(opt => opt.label)
        .join(', ');

    return (
        <div className="relative" ref={wrapperRef}>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <button
                type="button"
                id={name}
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-2 border border-gray-300 rounded-md bg-white text-left text-gray-900 flex justify-between items-center h-10"
            >
                <span className="truncate pr-2">
                    {selectedLabels || <span className="text-gray-500">Chọn nhân sự...</span>}
                </span>
                <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                    <ul>
                        {options.map(option => (
                            <li
                                key={option.value}
                                className="p-2 hover:bg-gray-100 cursor-pointer flex items-center"
                                onClick={() => handleSelect(option.value)}
                            >
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-secondary focus:ring-secondary mr-3 shrink-0"
                                    checked={selectedValues.includes(option.value)}
                                    readOnly
                                />
                                <span className="text-sm text-gray-900">{option.label}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, type = 'text', ...props }) => (
    <div>
        <label htmlFor={props.name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
            id={props.name}
            type={type}
            className={`w-full p-2 border rounded-md focus:ring-secondary focus:border-secondary bg-white text-gray-900 transition-colors ${
                props.required && !props.value ? 'border-red-400 bg-red-50' :
                    (type !== 'date' && !props.required && !props.value && props.name !== 'scheduleSheetUrl' && props.name !== 'scheduleSheetEditUrl')
                        ? 'border-orange-400 bg-orange-50'
                        : 'border-gray-300'
                }`}
            style={type === 'date' ? { colorScheme: 'light' } : {}}
            {...props}
        />
    </div>
);
