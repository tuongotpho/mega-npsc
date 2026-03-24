
import React, { useState, useEffect, useRef } from 'react';
import { Contractor } from '../types.ts';
import { useContractors } from '../hooks/useContractors.ts';
import { ChevronDownIcon } from '../../../shared/components/Icons.tsx';

interface ContractorSelectProps {
    label: string;
    type: 'Design' | 'Construction' | 'Supervision';
    value: { companyName: string; personnelName: string; phone: string };
    onChange: (val: { companyName: string; personnelName: string; phone: string }) => void;
}

const ContractorSelect: React.FC<ContractorSelectProps> = ({ label, type, value, onChange }) => {
    const { contractors, addContractor } = useContractors();
    const [inputValue, setInputValue] = useState(value.companyName);
    const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Sync internal input if parent updates value directly
    useEffect(() => {
        setInputValue(value.companyName);
    }, [value.companyName]);

    // Filter suggestions based on type and input
    const suggestions = contractors.filter(c => 
        c.type === type && 
        c.name.toLowerCase().includes(inputValue.toLowerCase())
    );

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsSuggestionsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setInputValue(newName);
        setIsSuggestionsOpen(true);
        onChange({ ...value, companyName: newName });
    };

    const handleSelectContractor = (contractor: Contractor) => {
        setInputValue(contractor.name);
        setIsSuggestionsOpen(false);
        // Pre-fill contact person/phone if available and current fields are empty
        const newPersonnel = value.personnelName || contractor.contactPerson || '';
        const newPhone = value.phone || contractor.phone || '';
        onChange({ 
            companyName: contractor.name, 
            personnelName: newPersonnel, 
            phone: newPhone 
        });
    };

    const handleBlur = () => {
        // Automatically save new contractor to library if it has a name and doesn't exist
        if (inputValue.trim()) {
            addContractor({
                name: inputValue.trim(),
                type: type,
                contactPerson: value.personnelName,
                phone: value.phone
            });
        }
    };

    return (
        <div className="space-y-3 p-4 bg-gray-50 rounded-md border">
            <h4 className="font-medium text-gray-800">{label}</h4>
            
            {/* Company Name Autocomplete */}
            <div className="relative" ref={wrapperRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên công ty / Đơn vị</label>
                <div className="relative">
                    <input
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary bg-white text-gray-900"
                        value={inputValue}
                        onChange={handleCompanyNameChange}
                        onFocus={() => setIsSuggestionsOpen(true)}
                        onBlur={handleBlur}
                        placeholder="Nhập hoặc chọn tên đơn vị..."
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                    </div>
                </div>
                
                {isSuggestionsOpen && suggestions.length > 0 && (
                    <ul className="absolute z-10 w-full bg-white shadow-lg max-h-48 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm mt-1">
                        {suggestions.map((c) => (
                            <li
                                key={c.id}
                                className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-50 text-gray-900"
                                onClick={() => handleSelectContractor(c)}
                            >
                                <span className="block truncate font-medium">{c.name}</span>
                                {c.contactPerson && <span className="block truncate text-xs text-gray-500">LH: {c.contactPerson}</span>}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Personnel Name */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cán bộ phụ trách (Chủ nhiệm/Chỉ huy)</label>
                <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary bg-white text-gray-900"
                    value={value.personnelName}
                    onChange={(e) => onChange({ ...value, personnelName: e.target.value })}
                />
            </div>

            {/* Phone */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary bg-white text-gray-900"
                    value={value.phone}
                    onChange={(e) => onChange({ ...value, phone: e.target.value })}
                />
            </div>
        </div>
    );
};

export default ContractorSelect;
