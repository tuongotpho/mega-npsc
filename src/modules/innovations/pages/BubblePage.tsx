import React, { useMemo, useState, useEffect, useRef } from 'react';
import { X, Building2, Lightbulb } from 'lucide-react';
import { Initiative } from '../types';
import InitiativeCard from '../components/InitiativeCard';

interface BubblePageProps {
  initiatives: Initiative[];
  activeTheme: any;
  user: any;
  onView: (item: Initiative) => void;
  onEdit: (item: Initiative) => void;
  onDelete: (id: string) => void;
}

interface BubbleNode {
  id: string; // Tên đơn vị
  count: number;
  radius: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}

const COLORS = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500', 'bg-lime-500', 
  'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-sky-500', 
  'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 
  'bg-pink-500', 'bg-rose-500'
];

const BubblePage: React.FC<BubblePageProps> = ({ initiatives, activeTheme, user, onView, onEdit, onDelete }) => {
  const [nodes, setNodes] = useState<BubbleNode[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | undefined>(undefined);

  // 1. Tổng hợp dữ liệu
  const unitData = useMemo(() => {
    const counts: Record<string, number> = {};
    initiatives.forEach(i => {
      const units = Array.isArray(i.unit) ? i.unit : (i.unit ? [i.unit] : []);
      units.forEach(u => {
        counts[u] = (counts[u] || 0) + 1;
      });
    });
    return counts;
  }, [initiatives]);

  // 2. Khởi tạo Nodes ban đầu
  useEffect(() => {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    const centerX = width / 2;
    const centerY = height / 2;

    // Fix: Explicitly cast Object.entries to [string, number][] to avoid 'unknown' type errors when processing counts.
    const entries = Object.entries(unitData) as [string, number][];
    const maxCount = Math.max(...entries.map(([, c]) => c));
    const minCount = Math.min(...entries.map(([, c]) => c));

    const getRadius = (val: number) => {
      if (maxCount === minCount) return 60;
      // Tăng kích thước tối thiểu để dễ quan sát text
      return 50 + ((val - minCount) / (maxCount - minCount)) * 70;
    };

    const newNodes: BubbleNode[] = entries.map(([name, count], index) => ({
      id: name,
      count,
      radius: getRadius(count),
      // Phân tán các node ra xa tâm lúc khởi tạo
      x: centerX + (Math.random() - 0.5) * width * 0.8,
      y: centerY + (Math.random() - 0.5) * height * 0.8,
      vx: 0,
      vy: 0,
      color: COLORS[index % COLORS.length]
    }));

    setNodes(newNodes);
  }, [unitData]);

  // 3. Vòng lặp vật lý (Simulation Loop)
  useEffect(() => {
    if (nodes.length === 0) return;

    const runSimulation = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      const centerX = width / 2;
      const centerY = height / 2;

      setNodes(prevNodes => {
        const nextNodes = prevNodes.map(n => ({ ...n }));

        // Cấu hình vật lý cải tiến
        const strength = 0.02; // Lực hút về tâm nhẹ hơn để không bị khít quá
        const drag = 0.85; // Ma sát cao hơn để bóng nhanh ổn định
        const padding = 25; // Tăng khoảng cách tối thiểu giữa các quả bóng

        for (let i = 0; i < nextNodes.length; i++) {
          const node = nextNodes[i];

          // Lực hút về tâm
          node.vx += (centerX - node.x) * strength;
          node.vy += (centerY - node.y) * strength;

          // Va chạm và đẩy nhau (Tách bóng)
          for (let j = 0; j < nextNodes.length; j++) {
            if (i === j) continue;
            const other = nextNodes[j];
            
            const dx = other.x - node.x;
            const dy = other.y - node.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = node.radius + other.radius + padding;

            if (dist < minDist) {
              const force = (minDist - dist) / (dist || 1);
              const fx = dx * force * 0.2; // Tăng lực đẩy để tách nhau ra
              const fy = dy * force * 0.2;

              node.vx -= fx;
              node.vy -= fy;
              
              // Thêm một chút lực đẩy ngẫu nhiên khi va chạm để tránh bị kẹt
              node.vx += (Math.random() - 0.5) * 0.1;
              node.vy += (Math.random() - 0.5) * 0.1;
            }
          }

          // Giới hạn trong khung hình
          const margin = node.radius + 10;
          if (node.x < margin) { node.x = margin; node.vx *= -0.5; }
          if (node.x > width - margin) { node.x = width - margin; node.vx *= -0.5; }
          if (node.y < margin) { node.y = margin; node.vy *= -0.5; }
          if (node.y > height - margin) { node.y = height - margin; node.vy *= -0.5; }

          node.x += node.vx;
          node.y += node.vy;

          node.vx *= drag;
          node.vy *= drag;
        }

        return nextNodes;
      });

      requestRef.current = requestAnimationFrame(runSimulation);
    };

    requestRef.current = requestAnimationFrame(runSimulation);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [nodes.length]);


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
         <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Bản đồ bóng bay</h2>
         <p className="text-slate-400 text-xs font-bold uppercase tracking-widest hidden lg:block">Click vào quả bóng để xem danh sách</p>
      </div>

      {/* Container chứa các bóng - Sẽ ẩn đi khi có selectedUnit */}
      <div 
        ref={containerRef} 
        className={`flex-1 relative bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner transition-opacity duration-500 ${selectedUnit ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        {nodes.map(node => (
          <div
            key={node.id}
            onClick={() => setSelectedUnit(node.id)}
            style={{
              width: node.radius * 2,
              height: node.radius * 2,
              transform: `translate(${node.x - node.radius}px, ${node.y - node.radius}px)`,
              zIndex: Math.round(node.radius)
            }}
            className={`absolute top-0 left-0 rounded-full shadow-lg flex flex-col items-center justify-center text-center cursor-pointer hover:scale-110 hover:shadow-2xl transition-all duration-300 group border-4 border-white/30 backdrop-blur-sm ${node.color} bg-opacity-90`}
          >
             <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>
             <p className="font-black text-white text-[10px] lg:text-[11px] uppercase leading-tight px-3 drop-shadow-md z-10 w-full overflow-hidden text-ellipsis px-4">{node.id}</p>
             <span className="mt-1 bg-black/20 px-2.5 py-0.5 rounded-full text-[10px] font-black text-white z-10 border border-white/10">{node.count}</span>
          </div>
        ))}
      </div>

      {/* Danh sách sáng kiến hiển thị đè lên và ẩn bóng đi */}
      {selectedUnit && (
        <div className="absolute inset-0 z-[100] flex flex-col animate-slide bg-white dark:bg-slate-950 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
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

export default BubblePage;

