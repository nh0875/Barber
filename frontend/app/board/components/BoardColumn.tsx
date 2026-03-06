"use client";

import SubCard from './CutCard';

interface BoardColumnProps {
  title: string;
  count: number;
  cuts: any[];
  color: string;
  hideActions?: boolean;
}

export default function BoardColumn({ title, count, cuts, color, hideActions }: BoardColumnProps) {
  return (
    <div className={`bg-zinc-800/40 rounded-2xl border-t-4 ${color} p-4 flex flex-col h-full overflow-hidden`}>
      <div className="flex items-center justify-between mb-4 px-1 shrink-0">
        <h2 className="text-sm font-bold text-zinc-300 tracking-wider">{title}</h2>
        <span className="bg-zinc-700/50 text-zinc-400 text-xs py-1 px-2.5 rounded-full font-mono">{count}</span>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-transparent">
        {cuts.map(cut => (
          <SubCard key={cut.id} cut={cut} hideActions={hideActions} />
        ))}
        {cuts.length === 0 && (
          <div className="text-center text-zinc-600 text-sm py-8 border border-dashed border-zinc-700/50 rounded-xl">
            Vacío
          </div>
        )}
      </div>
    </div>
  );
}
