import React, { useState, useEffect } from 'react';
import { Shield, Zap, ShieldCheck, Vote } from 'lucide-react';
import WalletConnector from './components/WalletConnector';
import VotingPanel from './components/VotingPanel';
import AdminPanel from './components/AdminPanel';
import { getOwner } from './utils/blockchainHelpers';

type View = 'voting' | 'admin';

const App = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [walletAddress, setWalletAddress] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [view, setView] = useState<View>('voting');

    useEffect(() => {
        if (!walletAddress) return;
        getOwner()
            .then((owner) => setIsAdmin(owner.toLowerCase() === walletAddress.toLowerCase()))
            .catch(() => setIsAdmin(false));
    }, [walletAddress]);

    const handleConnect = (address: string) => {
        setIsConnected(true);
        setWalletAddress(address);
        setView('voting');
    };

    const handleDisconnect = () => {
        setIsConnected(false);
        setWalletAddress('');
        setIsAdmin(false);
        setView('voting');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
            {/* Animated background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="relative z-10 container mx-auto px-4 py-8">
                <header className="text-center mb-12">
                    <div className="flex items-center justify-center mb-4">
                        <Shield className="w-12 h-12 text-blue-400 mr-3" />
                        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            BlockVote
                        </h1>
                    </div>
                    <p className="text-xl text-gray-300">Nền tảng bầu cử phi tập trung</p>
                    <div className="flex items-center justify-center mt-2 text-green-400">
                        <Zap className="w-4 h-4 mr-1" />
                        <span className="text-sm">Được vận hành bởi Ethereum Blockchain</span>
                    </div>
                </header>

                <WalletConnector
                    isConnected={isConnected}
                    walletAddress={walletAddress}
                    onConnect={handleConnect}
                    onDisconnect={handleDisconnect}
                />

                {/* Admin / Voting toggle (chỉ hiện khi đã kết nối) */}
                {isConnected && isAdmin && (
                    <div className="flex justify-center mb-8 gap-3">
                        <button
                            onClick={() => setView('voting')}
                            className={`flex items-center px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                                view === 'voting'
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                    : 'bg-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-700'
                            }`}
                        >
                            <Vote className="w-4 h-4 mr-2" />
                            Trang bầu cử
                        </button>
                        <button
                            onClick={() => setView('admin')}
                            className={`flex items-center px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                                view === 'admin'
                                    ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white shadow-lg'
                                    : 'bg-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-700'
                            }`}
                        >
                            <ShieldCheck className="w-4 h-4 mr-2" />
                            Trang quản trị
                        </button>
                    </div>
                )}

                {isConnected && view === 'voting' && (
                    <VotingPanel walletAddress={walletAddress} />
                )}

                {isConnected && view === 'admin' && isAdmin && (
                    <AdminPanel walletAddress={walletAddress} />
                )}

            </div>
        </div>
    );
};

export default App;
