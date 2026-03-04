'use client';

import { Menu } from 'lucide-react';

interface MobileHeaderProps {
    onOpenSidebar: () => void;
}

export default function MobileHeader({ onOpenSidebar }: MobileHeaderProps) {
    return (
        <header className="flex h-16 items-center justify-between border-b border-white/10 px-4 bg-slate-900/50 backdrop-blur-md lg:hidden sticky top-0 z-30">
            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Chiquinho<span className="text-white/90">Sorvetes</span>
            </h1>

            <button
                onClick={onOpenSidebar}
                className="p-2 text-slate-400 hover:text-white transition-colors"
                aria-label="Abrir menu"
            >
                <Menu className="h-6 w-6" />
            </button>
        </header>
    );
}
