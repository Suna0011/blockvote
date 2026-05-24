import React from 'react';
import { Wallet, LogOut } from 'lucide-react';
import { BrowserProvider } from 'ethers';
import { truncateAddress } from '../utils/blockchainHelpers';

interface Props {
  isConnected: boolean;
  walletAddress: string;
  onConnect: (address: string) => void;
  onDisconnect: () => void;
}

const WalletConnector: React.FC<Props> = ({ isConnected, walletAddress, onConnect, onDisconnect }) => {
  const handleConnect = async () => {
    if (!window.ethereum) {
      alert('MetaMask chưa được cài đặt. Vui lòng cài MetaMask để sử dụng tính năng này.');
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      onConnect(address);
    } catch (err) {
      console.error('MetaMask connection error:', err);
      alert('Kết nối ví thất bại. Vui lòng kiểm tra console để biết thêm chi tiết.');
    }
  };

  return (
    <div className="flex justify-center mb-12 space-x-4">
      {!isConnected ? (
        <button
          onClick={handleConnect}
          className="flex items-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-blue-500/25"
        >
          <Wallet className="w-6 h-6 mr-3" />
          Kết nối ví MetaMask
        </button>
      ) : (
        <>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 px-6 py-4 rounded-xl flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 font-semibold">Đã kết nối: </span>
            <span className="ml-2 font-mono text-gray-300">{truncateAddress(walletAddress)}</span>
          </div>
          <button
            onClick={onDisconnect}
            className="flex items-center bg-amber-600 hover:bg-amber-700 px-6 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl"
          >
            <LogOut className="w-6 h-6 mr-2" />
            Ngắt kết nối
          </button>
        </>
      )}
    </div>
  );
};

export default WalletConnector;
