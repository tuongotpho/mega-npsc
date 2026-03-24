
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Award, Calendar, Lightbulb, Building2, ChevronDown, X, Check, FilterX, LayoutGrid, List as ListIcon, Eye, Edit2, Trash2, Users, Briefcase, FileDown, Loader2, TrendingUp } from 'lucide-react';
import { Initiative, InitiativeLevel } from '../types';
import InitiativeCard from '../components/InitiativeCard';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ListPageProps {
  initiatives: Initiative[];
  activeTheme: any;
  user: any;
  onView: (item: Initiative) => void;
  onEdit: (item: Initiative) => void;
  onDelete: (id: string) => void;
}

const ITEMS_PER_PAGE = 12;

const LEVEL_COLORS: Record<InitiativeLevel, string> = {
  'HLH': 'bg-slate-500',
  'NPSC': 'bg-red-600',
  'NPC': 'bg-orange-600',
  'EVN': 'bg-rose-700'
};

// --- REUSABLE DROPDOWN COMPONENT ---
interface FilterOption {
  value: string | number;
  label: string;
  count: number;
}

interface FilterDropdownProps {
  label: string;
  icon: React.ElementType;
  options: FilterOption[];
  selected: (string | number)[];
  onToggle: (value: string | number) => void;
  searchable?: boolean;
  placeholder?: string;
  activeTheme: any;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({ 
  label, icon: Icon, options, selected, onToggle, searchable = true, placeholder = "Tìm kiếm...", activeTheme 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    String(opt.label).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-2 relative" ref={dropdownRef}>
      <p className="text-[9px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1.5">
        <Icon size={10}/> {label}
      </p>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-5 py-3.5 border rounded-2xl text-xs font-bold transition-all shadow-sm
          ${selected.length > 0 
            ? `bg-white dark:bg-slate-800 ${activeTheme.border} ${activeTheme.text}` 
            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-orange-200'}`}
      >
        <span className="truncate">
          {selected.length > 0 ? `Đã chọn (${selected.length})` : `Tất cả ${label}`}
        </span>
        <ChevronDown size={16} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] shadow-2xl p-4 space-y-3 animate-slide z-[100] min-w-[240px]">
          {searchable && (
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder={placeholder}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 text-slate-900 dark:bg-slate-800 border-none rounded-xl text-xs font-bold outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
          )}
          <div className="max-h-60 overflow-y-auto custom-scrollbar pr-1 space-y-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => {
                const isSelected = selected.includes(opt.value);
                return (
                  <button 
                    key={opt.value} 
                    onClick={() => onToggle(opt.value)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase transition-all flex items-center justify-between 
                      ${isSelected ? `${activeTheme.accent} ${activeTheme.text}` : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'}`}
                  >
                    <span className="truncate pr-2">{opt.label}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-md min-w-[24px] text-center ${isSelected ? 'bg-white/30 text-slate-700' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                        {opt.count}
                      </span>
                      {isSelected && <Check size={14} />}
                    </div>
                  </button>
                );
              })
            ) : (
              <p className="text-[10px] text-center text-slate-400 py-4 uppercase font-bold tracking-widest">Không tìm thấy dữ liệu</p>
            )}
          </div>
        </div>
      )}

      {/* Selected Tags */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selected.map(val => (
            <div key={val} className={`${activeTheme.primary} text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase flex items-center gap-1.5 animate-in fade-in zoom-in shadow-sm`}>
              <span className="max-w-[100px] truncate">{val}</span>
              <button onClick={() => onToggle(val)} className="hover:text-red-200 transition-colors">
                <X size={12} strokeWidth={3} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- MAIN COMPONENT ---

const ListPage: React.FC<ListPageProps> = ({ initiatives, activeTheme, user, onView, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter States
  const [selectedLevels, setSelectedLevels] = useState<InitiativeLevel[]>([]);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [showScalableOnly, setShowScalableOnly] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isExporting, setIsExporting] = useState(false);

  // --- FILTER LOGIC ---

  const getMatches = (item: Initiative, levels: InitiativeLevel[], years: number[], units: string[], fields: string[]) => {
    const unitArray = Array.isArray(item.unit) ? item.unit : (item.unit ? [item.unit] : []);
    
    // Normalize field to array for compatibility
    let fieldArray: string[] = [];
    if (Array.isArray(item.field)) {
        fieldArray = item.field;
    } else if (item.field) {
        fieldArray = [item.field as string];
    }
    
    const matchesLevel = levels.length === 0 || (item.level && item.level.some(l => levels.includes(l as InitiativeLevel)));
    const matchesYear = years.length === 0 || years.includes(item.year);
    const matchesUnit = units.length === 0 || unitArray.some(u => units.includes(u));
    // Updated Logic: Check if ANY of the item's fields match ANY of the selected filter fields
    const matchesField = fields.length === 0 || fieldArray.some(f => fields.includes(f));
    
    return { matchesLevel, matchesYear, matchesUnit, matchesField };
  };

  // Helper to calculate counts for dropdowns (Faceted Search)
  const getFacetedCounts = (type: 'level' | 'year' | 'unit' | 'field') => {
    const counts: Record<string, number> = {};
    
    initiatives.forEach(i => {
      // Check if item matches OTHER filters (exclude current type)
      const { matchesLevel, matchesYear, matchesUnit, matchesField } = getMatches(
        i, 
        type === 'level' ? [] : selectedLevels, 
        type === 'year' ? [] : selectedYears, 
        type === 'unit' ? [] : selectedUnits,
        type === 'field' ? [] : selectedFields
      );
      
      // Also check scalable filter
      const matchesScalable = !showScalableOnly || i.isScalable;

      if (
        (type === 'level' && matchesYear && matchesUnit && matchesField && matchesScalable) ||
        (type === 'year' && matchesLevel && matchesUnit && matchesField && matchesScalable) ||
        (type === 'unit' && matchesLevel && matchesYear && matchesField && matchesScalable) ||
        (type === 'field' && matchesLevel && matchesYear && matchesUnit && matchesScalable)
      ) {
        if (type === 'level') i.level?.forEach(l => { counts[l] = (counts[l] || 0) + 1; });
        if (type === 'year') { counts[String(i.year)] = (counts[String(i.year)] || 0) + 1; }
        if (type === 'unit') {
           const us = Array.isArray(i.unit) ? i.unit : (i.unit ? [i.unit] : []);
           us.forEach(u => { counts[u] = (counts[u] || 0) + 1; });
        }
        if (type === 'field') {
            const fs = Array.isArray(i.field) ? i.field : (i.field ? [i.field as string] : []);
            fs.forEach(f => { counts[f] = (counts[f] || 0) + 1; });
        }
      }
    });
    return counts;
  };

  // --- DATA PREPARATION FOR DROPDOWNS ---
  // Updated: Filter out options with 0 count unless they are currently selected

  const levelOptions = useMemo(() => {
    const counts = getFacetedCounts('level');
    return (['HLH', 'NPSC', 'NPC', 'EVN'] as InitiativeLevel[])
      .map(l => ({
        value: l, label: l, count: counts[l] || 0
      }))
      .filter(opt => opt.count > 0 || selectedLevels.includes(opt.value));
  }, [initiatives, selectedYears, selectedUnits, selectedFields, showScalableOnly, selectedLevels]);

  const yearOptions = useMemo(() => {
    const counts = getFacetedCounts('year');
    const allYears = Array.from(new Set(initiatives.map(i => i.year))).sort((a, b) => (b as number) - (a as number));
    return allYears
      .map(y => ({
        value: y, label: y.toString(), count: counts[String(y)] || 0
      }))
      .filter(opt => opt.count > 0 || selectedYears.includes(opt.value));
  }, [initiatives, selectedLevels, selectedUnits, selectedFields, showScalableOnly, selectedYears]);

  const unitOptions = useMemo(() => {
    const counts = getFacetedCounts('unit');
    const allUnits = new Set<string>();
    initiatives.forEach(i => {
       const us = Array.isArray(i.unit) ? i.unit : (i.unit ? [i.unit] : []);
       us.forEach(u => allUnits.add(u));
    });
    return Array.from(allUnits).sort()
      .map(u => ({
        value: u, label: u, count: counts[u] || 0
      }))
      .filter(opt => opt.count > 0 || selectedUnits.includes(opt.value));
  }, [initiatives, selectedLevels, selectedYears, selectedFields, showScalableOnly, selectedUnits]);

  const fieldOptions = useMemo(() => {
    const counts = getFacetedCounts('field');
    const allFields = new Set<string>();
    initiatives.forEach(i => { 
        const fs = Array.isArray(i.field) ? i.field : (i.field ? [i.field as string] : []);
        fs.forEach(f => allFields.add(f));
    });
    return Array.from(allFields).sort()
      .map(f => ({
        value: f, label: f, count: counts[f] || 0
      }))
      .filter(opt => opt.count > 0 || selectedFields.includes(opt.value));
  }, [initiatives, selectedLevels, selectedYears, selectedUnits, showScalableOnly, selectedFields]);


  // --- MAIN FILTER LOGIC ---

  const filtered = useMemo(() => {
    return initiatives.filter(i => {
      const unitArray = Array.isArray(i.unit) ? i.unit : (i.unit ? [i.unit] : []);
      const { matchesLevel, matchesYear, matchesUnit, matchesField } = getMatches(i, selectedLevels, selectedYears, selectedUnits, selectedFields);
      
      const matchesScalable = !showScalableOnly || i.isScalable;

      const unitStr = unitArray.join(' ');
      const matchesSearch = searchTerm === '' || 
                           i.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (i.authors?.some(a => a.toLowerCase().includes(searchTerm.toLowerCase()))) ||
                           unitStr.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesLevel && matchesYear && matchesUnit && matchesField && matchesScalable && matchesSearch;
    });
  }, [searchTerm, selectedLevels, selectedYears, selectedUnits, selectedFields, showScalableOnly, initiatives]);

  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  const clearFilters = () => {
    setSelectedLevels([]);
    setSelectedYears([]);
    setSelectedUnits([]);
    setSelectedFields([]);
    setSearchTerm('');
    setShowScalableOnly(false);
    setCurrentPage(1);
  };

  const toggleLevel = (val: string | number) => {
    const l = val as InitiativeLevel;
    setSelectedLevels(prev => prev.includes(l) ? prev.filter(item => item !== l) : [...prev, l]);
    setCurrentPage(1);
  };
  const toggleYear = (val: string | number) => {
    const y = val as number;
    setSelectedYears(prev => prev.includes(y) ? prev.filter(item => item !== y) : [...prev, y]);
    setCurrentPage(1);
  };
  const toggleUnit = (val: string | number) => {
    const u = val as string;
    setSelectedUnits(prev => prev.includes(u) ? prev.filter(item => item !== u) : [...prev, u]);
    setCurrentPage(1);
  };
  const toggleField = (val: string | number) => {
    const f = val as string;
    setSelectedFields(prev => prev.includes(f) ? prev.filter(item => item !== f) : [...prev, f]);
    setCurrentPage(1);
  };

  // --- PDF EXPORT LOGIC ---
  const handleExportPDF = async () => {
    setIsExporting(true);
    
    try {
      // 1. Initialize Document - Landscape A4
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // 2. Load Vietnamese Font (Roboto Regular) from CDN to support Unicode
      const fontUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf';
      const response = await fetch(fontUrl);
      const buffer = await response.arrayBuffer();
      
      // Convert to Base64 manually to avoid large dependency
      const blob = new Blob([buffer]);
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const base64data = (reader.result as string).split(',')[1];
        
        // Add font to VFS
        doc.addFileToVFS('Roboto-Regular.ttf', base64data);
        // Register font as 'normal'
        doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
        // Register same font as 'bold' to prevent fallback issues in table headers
        doc.addFont('Roboto-Regular.ttf', 'Roboto', 'bold');
        
        doc.setFont('Roboto', 'normal');

        // 3. Header Info (Center for Landscape A4 is approx 148.5mm)
        // Position below top margin (10mm)
        doc.setFontSize(18);
        doc.setTextColor(234, 88, 12); // Orange-600
        doc.text("BÁO CÁO SÁNG KIẾN - NPSC", 148.5, 18, { align: "center" });
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Ngày xuất báo cáo: ${new Date().toLocaleDateString('vi-VN')}`, 148.5, 24, { align: "center" });
        
        // Add User Info if available
        if (user?.email) {
          doc.text(`Người xuất: ${user.email}`, 148.5, 29, { align: "center" });
        }

        // 4. Table Columns
        const tableColumn = ["STT", "Năm", "Cấp", "Tên sáng kiến", "Đơn vị", "Tác giả", "Lĩnh vực"];
        
        // 5. Table Rows (Use filtered data, NOT paginated)
        const tableRows = filtered.map((item, index) => {
          const units = Array.isArray(item.unit) ? item.unit.join(', ') : (item.unit || '');
          const authors = Array.isArray(item.authors) ? item.authors.join(', ') : (item.authors || '');
          const levels = item.level?.join(', ') || '';
          const fields = Array.isArray(item.field) ? item.field.join(', ') : (item.field || '');

          return [
            index + 1,
            item.year,
            levels,
            item.title,
            units,
            authors,
            fields
          ];
        });

        // 6. Generate Table
        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 35,
          theme: 'grid',
          // Set specific margins: Left 15mm, others 10mm
          margin: { top: 10, right: 10, bottom: 10, left: 15 },
          styles: {
            font: 'Roboto', // Use the custom font globally for table
            fontStyle: 'normal',
            fontSize: 10,
            cellPadding: 3,
            overflow: 'linebreak'
          },
          headStyles: {
            fillColor: [234, 88, 12], // Orange-600 header
            textColor: 255,
            font: 'Roboto',
            fontStyle: 'bold', // This will use the aliased 'Roboto' (mapped to regular file) but properly encoded
            halign: 'center',
            valign: 'middle'
          },
          columnStyles: {
            0: { cellWidth: 12, halign: 'center' }, // STT
            1: { cellWidth: 15, halign: 'center' }, // Năm
            2: { cellWidth: 20, halign: 'center' }, // Cấp
            3: { cellWidth: 'auto' },               // Tên (Expand to fill landscape width)
            4: { cellWidth: 40 },                   // Đơn vị (Wider for landscape)
            5: { cellWidth: 40 },                   // Tác giả (Wider for landscape)
            6: { cellWidth: 30 },                   // Lĩnh vực
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252] // Slate-50
          }
        });

        // 7. Save
        doc.save(`Bao_Cao_Sang_Kien_NPSC_${new Date().getFullYear()}.pdf`);
        setIsExporting(false);
      };
      
      reader.readAsDataURL(blob);

    } catch (err) {
      console.error("PDF Export Error:", err);
      alert("Lỗi khi xuất báo cáo. Vui lòng kiểm tra kết nối mạng để tải font chữ.");
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6">
        {/* Top Bar: Title & View Mode & Global Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Kho sáng kiến</h2>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 ml-4">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? `${activeTheme.primary} text-white shadow-lg` : 'text-slate-400 hover:text-slate-600'}`}
                title="Dạng lưới"
              >
                <LayoutGrid size={20} />
              </button>
              <button 
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-xl transition-all ${viewMode === 'table' ? `${activeTheme.primary} text-white shadow-lg` : 'text-slate-400 hover:text-slate-600'}`}
                title="Dạng bảng"
              >
                <ListIcon size={20} />
              </button>
            </div>

            {/* Admin Export Button */}
            {user && (
              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title="Xuất báo cáo PDF"
              >
                {isExporting ? <Loader2 size={16} className="animate-spin"/> : <FileDown size={16} />}
                {isExporting ? 'Đang tạo...' : 'Xuất PDF'}
              </button>
            )}

            {(selectedLevels.length > 0 || selectedYears.length > 0 || selectedUnits.length > 0 || selectedFields.length > 0 || showScalableOnly) && (
              <button 
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl text-[10px] font-black uppercase hover:bg-rose-50 hover:text-rose-600 transition-all shadow-sm"
              >
                <FilterX size={14} /> Xóa lọc
              </button>
            )}
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Tìm kiếm theo tiêu đề, tác giả..." 
              className={`w-full pl-12 pr-6 py-4 bg-white text-slate-900 dark:bg-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm font-medium outline-none transition-all focus:ring-4 focus:ring-orange-500/10`} 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>

        {/* Filter Bar: Dropdowns Grid */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative z-50">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
            {/* 1. Cấp công nhận */}
            <FilterDropdown 
              label="Cấp công nhận" 
              icon={Award} 
              options={levelOptions} 
              selected={selectedLevels} 
              onToggle={toggleLevel}
              searchable={false} // Ít item, không cần search
              activeTheme={activeTheme}
            />

            {/* 2. Đơn vị */}
            <FilterDropdown 
              label="Đơn vị áp dụng" 
              icon={Building2} 
              options={unitOptions} 
              selected={selectedUnits} 
              onToggle={toggleUnit}
              placeholder="Tìm đơn vị..."
              activeTheme={activeTheme}
            />

            {/* 3. Lĩnh vực */}
            <FilterDropdown 
              label="Lĩnh vực" 
              icon={Briefcase} 
              options={fieldOptions} 
              selected={selectedFields} 
              onToggle={toggleField}
              placeholder="Tìm lĩnh vực..."
              activeTheme={activeTheme}
            />

            {/* 4. Năm công nhận */}
            <FilterDropdown 
              label="Năm công nhận" 
              icon={Calendar} 
              options={yearOptions} 
              selected={selectedYears} 
              onToggle={toggleYear}
              searchable={false}
              activeTheme={activeTheme}
            />

            {/* 5. Bộ lọc nhanh: Khả năng nhân rộng (NEW) */}
            <div className="space-y-2 relative">
               <p className="text-[9px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1.5">
                  <TrendingUp size={10}/> Chất lượng
               </p>
               <button 
                  onClick={() => {
                     setShowScalableOnly(!showScalableOnly);
                     setCurrentPage(1);
                  }}
                  className={`w-full flex items-center justify-between px-5 py-3.5 border rounded-2xl text-xs font-bold transition-all shadow-sm
                    ${showScalableOnly 
                       ? `bg-emerald-500 text-white border-transparent shadow-emerald-500/30` 
                       : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-orange-200'}`}
               >
                  <span className="truncate">Khả năng nhân rộng</span>
                  {showScalableOnly && <Check size={16} strokeWidth={3} />}
               </button>
            </div>
          </div>
        </div>
      </header>

      {/* Results View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8 animate-slide">
          {paginated.map(item => (
            <InitiativeCard 
              key={item.id} 
              item={item} 
              activeTheme={activeTheme} 
              user={user} 
              onView={onView} 
              onEdit={onEdit} 
              onDelete={onDelete} 
            />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-slide">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b dark:border-slate-700">Năm/Cấp</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b dark:border-slate-700">Tên sáng kiến</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b dark:border-slate-700">Đơn vị</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b dark:border-slate-700">Tác giả</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b dark:border-slate-700">Lĩnh vực</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b dark:border-slate-700 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginated.map(item => {
                  const fieldDisplay = Array.isArray(item.field) ? item.field.join(', ') : (item.field || '---');
                  
                  return (
                    <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs font-black text-slate-900 dark:text-white">{item.year}</span>
                          <div className="flex flex-wrap gap-1">
                            {item.level?.map(lvl => (
                              <span key={lvl} className={`${LEVEL_COLORS[lvl as InitiativeLevel]} text-white text-[8px] font-black px-2 py-0.5 rounded-md`}>{lvl}</span>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 max-w-md">
                        <div className="flex flex-col gap-1">
                          <p className="text-sm font-black text-slate-900 dark:text-white line-clamp-2 uppercase tracking-tight leading-tight group-hover:text-orange-600 transition-colors">{item.title}</p>
                          {item.isScalable && (
                            <span className="w-fit flex items-center gap-1 bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-md text-[8px] font-black uppercase">
                                <TrendingUp size={10} /> Nhân rộng
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                          <Building2 size={14} className={activeTheme.text} />
                          <span className="truncate max-w-[150px]">{Array.isArray(item.unit) ? item.unit.join(', ') : item.unit}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                          <Users size={14} className={activeTheme.text} />
                          <span className="truncate max-w-[120px]">{Array.isArray(item.authors) ? item.authors.join(', ') : item.authors}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                          <Briefcase size={14} />
                          <span className="truncate max-w-[100px]">{fieldDisplay}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => onView(item)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all" title="Xem chi tiết"><Eye size={18} /></button>
                          {user && (
                            <>
                              <button onClick={() => onEdit(item)} className={`p-2.5 text-slate-400 hover:${activeTheme.text} hover:${activeTheme.accent} dark:hover:bg-slate-800 rounded-xl transition-all`} title="Chỉnh sửa"><Edit2 size={18} /></button>
                              <button onClick={() => onDelete(item.id)} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all" title="Xóa"><Trash2 size={18} /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {paginated.length === 0 && (
        <div className="py-20 text-center text-slate-400">
          <div className="bg-slate-100 dark:bg-slate-900 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"><Lightbulb size={48} /></div>
          <p className="font-black uppercase tracking-widest text-xs">Không có sáng kiến nào khớp với bộ lọc</p>
          <button onClick={clearFilters} className="mt-4 text-orange-600 font-black text-[10px] uppercase underline">Đặt lại bộ lọc</button>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-12">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button 
              key={i} 
              onClick={() => {
                setCurrentPage(i + 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${currentPage === i + 1 ? `${activeTheme.primary} text-white shadow-lg` : 'bg-white dark:bg-slate-800 text-slate-400 hover:bg-slate-50'}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ListPage;
