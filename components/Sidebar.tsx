'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    FileText,
    Calendar,
    Settings,
    LogOut
} from 'lucide-react';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Clientes', href: '/clientes', icon: Users },
    { name: 'Conteúdos', href: '/conteudos', icon: FileText },
    { name: 'Postagens', href: '/postagens', icon: Calendar },
    { name: 'Configurações', href: '/configuracoes', icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
    };

    return (
        <div className="flex h-screen w-64 flex-col border-r border-white/10 glass">
            {/* Logo */}
            <div className="flex h-16 items-center justify-center border-b border-white/10 px-6 bg-purple-900/20">
                <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                    Chiquinho<span className="text-white/90">Sorvetes</span>
                </h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4">
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
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
    );
}
