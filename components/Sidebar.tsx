'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    FileText,
    Calendar,
    Settings,
    LogOut,
    X
} from 'lucide-react';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Clientes', href: '/clientes', icon: Users },
    { name: 'Conteúdos', href: '/conteudos', icon: FileText },
    { name: 'Postagens', href: '/postagens', icon: Calendar },
    { name: 'Configurações', href: '/configuracoes', icon: Settings },
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
    };

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm xl:hidden"
                    onClick={onClose}
                />
            )}

            <div className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/10 glass transition-transform duration-300 ease-in-out xl:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
                } xl:static xl:inset-auto xl:z-auto`}>
                {/* Logo & Close Button */}
                <div className="flex h-16 items-center justify-between border-b border-white/10 px-6 bg-purple-900/20">
                    <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                        Chiquinho<span className="text-white/90">Sorvetes</span>
                    </h1>
                    <button
                        onClick={onClose}
                        className="p-1 text-slate-400 hover:text-white xl:hidden"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={onClose}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${isActive
                                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-100 hover:pl-4'
                                    }`}
                            >
                                <item.icon className={`h-5 w-5 ${isActive ? 'text-purple-400' : 'text-slate-500'}`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout Button */}
                <div className="border-t border-white/10 p-3 bg-black/20">
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-all hover:bg-red-500/10 hover:text-red-400 hover:border hover:border-red-500/20"
                    >
                        <LogOut className="h-5 w-5" />
                        Sair
                    </button>
                </div>
            </div>
        </>
    );
}
