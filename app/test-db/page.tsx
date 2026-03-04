'use client';

import { useState, useEffect } from 'react';

export default function TestDbPage() {
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function testConnection() {
            try {
                const response = await fetch('/api/clientes');
                const data = await response.json();
                setStatus(data);
            } catch (err: any) {
                setStatus({ error: err.message });
            } finally {
                setLoading(false);
            }
        }
        testConnection();
    }, []);

    return (
        <div className="p-8 bg-white min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Teste de Conexão Supabase</h1>
            {loading ? (
                <p>Testando...</p>
            ) : (
                <div className="space-y-4">
                    <div className="p-4 bg-gray-100 rounded">
                        <h2 className="font-semibold">Resposta de /api/clientes:</h2>
                        <pre className="mt-2 text-xs overflow-auto max-h-96">
                            {JSON.stringify(status, null, 2)}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}
