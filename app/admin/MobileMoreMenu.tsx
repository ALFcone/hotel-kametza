"use client";

import { useRef } from "react";
import Link from "next/link";
import { LayoutDashboard, BedDouble, ShoppingCart, MoreHorizontal } from "lucide-react";

interface MobileMoreMenuProps {
  activeTab: string;
  dateFrom: string;
  dateTo: string;
}

export default function MobileMoreMenu({ activeTab, dateFrom, dateTo }: MobileMoreMenuProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const closeMenu = () => {
    if (detailsRef.current) detailsRef.current.open = false;
  };

  const items = [
    { tab: "estado", label: "Estado Habitaciones", icon: LayoutDashboard },
    { tab: "inventario", label: "Inventario", icon: BedDouble },
    { tab: "almacen", label: "Almacén / Minibar", icon: ShoppingCart },
  ];

  return (
    <details ref={detailsRef} className="group relative flex flex-col items-center">
      <summary
        className={`list-none [&::-webkit-details-marker]:hidden flex flex-col items-center gap-1 cursor-pointer ${
          items.some((item) => item.tab === activeTab) ? "text-amber-500" : "text-stone-400"
        }`}
      >
        <MoreHorizontal size={18} />
        <span className="text-[8px] font-black uppercase">Más</span>
      </summary>
      <div className="absolute bottom-full right-0 mb-4 w-52 bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl p-2 flex flex-col gap-1 z-50">
        {items.map(({ tab, label, icon: Icon }) => (
          <Link
            key={tab}
            href={`/admin?tab=${tab}&from=${dateFrom}&to=${dateTo}`}
            onClick={closeMenu}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider ${
              activeTab === tab ? "bg-amber-500/10 text-amber-400" : "text-stone-300 hover:bg-white/5"
            }`}
          >
            <Icon size={16} /> {label}
          </Link>
        ))}
      </div>
    </details>
  );
}
