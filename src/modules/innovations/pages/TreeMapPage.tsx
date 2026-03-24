
import React, { useMemo, useState, useRef, useEffect, useLayoutEffect } from 'react';
import { X, Building2, Lightbulb } from 'lucide-react';
import { Initiative } from '../types';
import InitiativeCard from '../components/InitiativeCard';

interface TreeMapPageProps {
  initiatives: Initiative[];
  activeTheme: any;
  user: any;
  onView: (item: Initiative) => void;
  onEdit: (item: Initiative) => void;
  onDelete: (id: string) => void;
}

interface TreeItem {
  id: string; // Tên đơn vị
  value: number; // Số lượng sáng kiến
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

const COLORS = [
  'bg-red-600', 'bg-orange-600', 'bg-amber-600', 'bg-yellow-600', 'bg-lime-600', 
  'bg-green-600', 'bg-emerald-600', 'bg-teal-600', 'bg-cyan-600', 'bg-sky-600', 
  'bg-blue-600', 'bg-indigo-600', 'bg-violet-600', 'bg-purple-600', 'bg-fuchsia-600', 
  'bg-pink-600', 'bg-rose-600'
];

const TreeMapPage: React.FC<TreeMapPageProps> = ({ initiatives, activeTheme, user, onView, onEdit, onDelete }) => {
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [treeItems, setTreeItems] = useState<TreeItem[]>([]);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  // 1. Tổng hợp dữ liệu
  const unitData = useMemo(() => {
    const counts: Record<string, number> = {};
    initiatives.forEach(i => {
      const units = Array.isArray(i.unit) ? i.unit : (i.unit ? [i.unit] : []);
      units.forEach(u => {
        counts[u] = (counts[u] || 0) + 1;
      });
    });
    // Sắp xếp giảm dần - Rất quan trọng cho thuật toán Squarified
    return Object.entries(counts)
      .map(([id, value], index) => ({ 
        id, 
        value, 
        color: COLORS[index % COLORS.length] 
      }))
      .sort((a, b) => b.value - a.value);
  }, [initiatives]);

  // 2. Observer để theo dõi kích thước thật của container
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        if (width > 0 && height > 0) {
          setContainerSize({ w: width, h: height });
        }
      }
    };

    updateSize(); // Initial measurement

    const observer = new ResizeObserver(() => {
      updateSize();
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  // 3. Thuật toán Squarified Treemap
  // Tham khảo: "Squarified Treemaps" by Bruls, Huizing, and van Wijk
  useEffect(() => {
    if (containerSize.w === 0 || containerSize.h === 0 || unitData.length === 0) return;

    const totalValue = unitData.reduce((acc, item) => acc + item.value, 0);
    const totalArea = containerSize.w * containerSize.h;
    
    // Chuẩn hóa dữ liệu: chuyển value thành diện tích pixel
    const dataWithArea = unitData.map(item => ({
      ...item,
      area: (totalValue === 0) ? 0 : (item.value / totalValue) * totalArea
    }));

    // Tính tỷ lệ khung hình xấu nhất (Worst Aspect Ratio) trong một hàng
    // row: danh sách items hiện tại trong hàng
    // length: độ dài cạnh ngắn nhất của hình chữ nhật còn lại
    const getWorstRatio = (row: typeof dataWithArea, length: number) => {
      if (row.length === 0) return Infinity;
      const rowArea = row.reduce((sum, item) => sum + item.area, 0);
      const rowSide = rowArea / length; // Độ dày của hàng
      const minArea = row[row.length - 1].area; // Do đã sort giảm dần
      const maxArea = row[0].area;
      
      const length2 = length * length;
      const area2 = rowArea * rowArea;
      
      // Công thức: max(w/h, h/w) cho từng item trong hàng
      return Math.max(
        (length2 * maxArea) / area2,
        area2 / (length2 * minArea)
      );
    };

    const results: TreeItem[] = [];
    let x = 0, y = 0, w = containerSize.w, h = containerSize.h;

    // Hàm layout một hàng item vào hình chữ nhật còn lại
    const layoutRow = (row: typeof dataWithArea) => {
      const rowArea = row.reduce((sum, item) => sum + item.area, 0);
      
      // Quyết định hướng layout dựa trên cạnh ngắn nhất của không gian còn lại
      // Nếu w > h (nằm ngang), ta cắt một cột dọc bên trái (chiều cao h cố định)
      // Nếu h > w (nằm dọc), ta cắt một hàng ngang bên trên (chiều rộng w cố định)
      const verticalSplit = w >= h; 
      
      if (verticalSplit) {
        // Cạnh ngắn nhất là h. Ta xếp dọc theo cạnh h.
        // Hàng sẽ là một cột dọc có bề rộng = rowArea / h
        const rowWidth = rowArea / h;
        let currentY = y;
        row.forEach(item => {
          const itemHeight = item.area / rowWidth;
          results.push({
            id: item.id,
            value: item.value,
            color: item.color,
            x: x,
            y: currentY,
            w: rowWidth,
            h: itemHeight
          });
          currentY += itemHeight;
        });
        // Cập nhật không gian còn lại
        x += rowWidth;
        w -= rowWidth;
      } else {
        // Cạnh ngắn nhất là w. Ta xếp ngang theo cạnh w.
        // Hàng sẽ là một dải ngang có chiều cao = rowArea / w
        const rowHeight = rowArea / w;
        let currentX = x;
        row.forEach(item => {
          const itemWidth = item.area / rowHeight;
          results.push({
            id: item.id,
            value: item.value,
            color: item.color,
            x: currentX,
            y: y,
            w: itemWidth,
            h: rowHeight
          });
          currentX += itemWidth;
        });
        // Cập nhật không gian còn lại
        y += rowHeight;
        h -= rowHeight;
      }
    };

    // Hàm đệ quy chính
    const squarify = (children: typeof dataWithArea) => {
      if (children.length === 0) return;
      
      const shortestSide = Math.min(w, h);
      let row = [children[0]];
      let i = 1;
      
      // Thử thêm items vào hàng hiện tại miễn là tỷ lệ khung hình không xấu đi
      for (; i < children.length; i++) {
        const item = children[i];
        const currentWorst = getWorstRatio(row, shortestSide);
        const nextWorst = getWorstRatio([...row, item], shortestSide);
        
        if (nextWorst <= currentWorst) {
          row.push(item);
        } else {
          // Nếu thêm vào làm tỷ lệ xấu đi, thì chốt hàng cũ và bắt đầu hàng mới
          break;
        }
      }
      
      layoutRow(row);
      squarify(children.slice(i)); // Đệ quy với các phần tử còn lại
    };

    squarify(dataWithArea);
    setTreeItems(results);

  }, [unitData, containerSize]);


  const selectedInitiatives = useMemo(() => {
    if (!selectedUnit) return [];
    return initiatives.filter(i => {
      const units = Array.isArray(i.unit) ? i.unit : (i.unit ? [i.unit] : []);
      return units.includes(selectedUnit);
    });
  }, [selectedUnit, initiatives]);

  return (
    <div className="relative h-[85vh] w-full overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-4 shrink-0">
         <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Bản đồ nhiệt</h2>
         <p className="text-slate-400 text-xs font-bold uppercase tracking-widest hidden lg:block">Click vào ô vuông để xem danh sách</p>
      </div>

      <div className="flex-1 relative bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner p-2">
         {/* Container div để đo kích thước */}
         <div ref={containerRef} className="w-full h-full relative rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
            {treeItems.map((item) => (
               <div
                  key={item.id}
                  onClick={() => setSelectedUnit(item.id)}
                  style={{
                     left: item.x,
                     top: item.y,
                     width: item.w,
                     height: item.h,
                  }}
                  className={`absolute border-2 border-white dark:border-slate-900 cursor-pointer transition-all duration-300 hover:brightness-110 hover:z-10 hover:shadow-2xl hover:scale-[1.02] flex flex-col items-center justify-center p-2 text-center group ${item.color}`}
               >
                  <div className="w-full h-full flex flex-col items-center justify-center overflow-hidden">
                     {/* Chỉ hiện text nếu ô đủ lớn */}
                     {(item.w > 40 && item.h > 30) && (
                        <>
                           <span className={`font-black text-white uppercase leading-tight drop-shadow-md truncate w-full px-1 ${item.w < 80 ? 'text-[9px]' : 'text-xs lg:text-sm'}`}>
                              {item.id}
                           </span>
                           {(item.w > 60 && item.h > 50) && (
                              <span className="mt-1 text-white/90 font-bold text-[10px] bg-black/10 px-2 py-0.5 rounded-full">{item.value}</span>
                           )}
                           {/* Tooltip on hover for small items */}
                           {(item.w <= 60 || item.h <= 50) && (
                              <div className="hidden group-hover:block absolute z-50 bg-slate-800 text-white text-xs px-3 py-2 rounded-xl shadow-xl whitespace-nowrap -mt-10 font-bold border border-slate-700 pointer-events-none">
                                 {item.id}: {item.value} sáng kiến
                              </div>
                           )}
                        </>
                     )}
                  </div>
               </div>
            ))}
            {/* Fallback khi chưa có dữ liệu hoặc đang tính toán */}
            {treeItems.length === 0 && unitData.length > 0 && (
               <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                  Đang tính toán biểu đồ...
               </div>
            )}
         </div>
      </div>

      {/* Detail Modal / Drawer */}
      {selectedUnit && (
        <div className="absolute inset-0 z-[100] flex flex-col animate-slide bg-white dark:bg-slate-950 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
             <div className="flex items-center gap-4">
                <div className={`${activeTheme.primary} p-4 rounded-2xl text-white shadow-lg`}><Building2 size={24}/></div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{selectedUnit}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedInitiatives.length} sáng kiến được ghi nhận</p>
                </div>
             </div>
             <button 
                onClick={() => setSelectedUnit(null)} 
                className="p-4 bg-white dark:bg-slate-800 text-slate-400 hover:text-orange-600 rounded-2xl transition-all shadow-sm flex items-center gap-2 font-black text-xs uppercase"
             >
                Đóng danh sách <X size={20}/>
             </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-6 custom-scrollbar bg-[#f8fafc] dark:bg-slate-950">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {selectedInitiatives.length > 0 ? selectedInitiatives.map(item => (
                <InitiativeCard 
                  key={item.id}
                  item={item}
                  activeTheme={activeTheme}
                  user={user}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              )) : (
                <div className="col-span-full text-center py-20 opacity-50">
                  <Lightbulb size={48} className="mx-auto mb-4 text-slate-400"/>
                  <p className="uppercase font-bold text-slate-400">Không có dữ liệu chi tiết</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TreeMapPage;


