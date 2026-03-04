export default function ConfiguracoesPage() {
    return (
        <div className="p-8 min-h-screen">
            <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Configurações
            </h1>

            <div className="glass-card p-8 rounded-xl max-w-2xl">
                <h2 className="text-xl font-semibold text-white mb-6 border-b border-white/10 pb-4">
                    Informações do Sistema
                </h2>
                <div className="space-y-4 text-slate-300">
                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                        <span className="font-medium text-slate-400">Sistema</span>
                        <span className="text-white">Gestão de Conteúdo Instagram</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                        <span className="font-medium text-slate-400">Versão</span>
                        <span className="text-white font-mono bg-purple-500/20 px-2 py-1 rounded text-purple-300 border border-purple-500/30">v1.0.0</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                        <span className="font-medium text-slate-400">Licenciado para</span>
                        <span className="text-white">Chiquinho Sorvetes</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
