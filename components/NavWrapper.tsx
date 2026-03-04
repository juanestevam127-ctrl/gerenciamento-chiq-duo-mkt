'use client';

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";

interface NavWrapperProps {
    children: React.ReactNode;
}

export default function NavWrapper({ children }: NavWrapperProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden bg-[#020617] relative">
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <div className="flex flex-1 flex-col overflow-hidden">
                <MobileHeader onOpenSidebar={() => setIsSidebarOpen(true)} />

                <main className="flex-1 overflow-y-auto relative min-w-0">
                    {/* Background effects */}
                    <div className="absolute inset-0 z-0 pointer-events-none">
                        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px]" />
                        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-[100px]" />
                    </div>
                    <div className="relative z-10 p-4 lg:p-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
