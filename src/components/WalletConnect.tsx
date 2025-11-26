import React, { useState, useEffect } from 'react';
import { walletService } from '../utils/bch';

const NewWalletInfo: React.FC<{ wif: string, seed: string, onAcknowledge: () => void }> = ({ wif, seed, onAcknowledge }) => {
    const [showWif, setShowWif] = useState(false);
    const [showSeed, setShowSeed] = useState(false);

    return (
        <div className="space-y-4">
            <p className="text-yellow-400 font-semibold">Your new wallet has been created. Please save these details securely. They cannot be recovered if lost.</p>
            
            <div className="bg-gray-700 p-3 rounded">
                <p className="text-sm text-gray-400">Private Key (WIF)</p>
                <div className="flex items-center gap-2">
                    <p className={`font-mono text-red-400 text-xs break-all ${!showWif && 'blur-sm'}`}>{wif}</p>
                    <button onClick={() => setShowWif(!showWif)} className="text-xs bg-gray-600 px-2 py-1 rounded">{showWif ? 'Hide' : 'Show'}</button>
                </div>
            </div>

            <div className="bg-gray-700 p-3 rounded">
                <p className="text-sm text-gray-400">Seed Phrase</p>
                <div className="flex items-center gap-2">
                    <p className={`font-mono text-red-400 text-xs break-all ${!showSeed && 'blur-sm'}`}>{seed}</p>
                    <button onClick={() => setShowSeed(!showSeed)} className="text-xs bg-gray-600 px-2 py-1 rounded">{showSeed ? 'Hide' : 'Show'}</button>
                </div>
            </div>

            <button onClick={onAcknowledge} className="w-full bg-green-500 hover:bg-green-600 py-2 rounded font-semibold transition">
                I have saved my details, continue
            </button>
        </div>
    );
};

export const WalletConnect: React.FC = () => {
    const [wif, setWif] = useState('');
    const [address, setAddress] = useState('');
    const [balance, setBalance] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [newWallet, setNewWallet] = useState<{ wif: string, seed: string } | null>(null);

    useEffect(() => {
        const savedWif = localStorage.getItem('wallet_wif');
        if (savedWif) {
            setWif(savedWif);
            initializeWallet(savedWif);
        }
    }, []);

    const initializeWallet = async (walletWifOrSeed: string) => {
        setLoading(true);
        try {
            await walletService.importWallet(walletWifOrSeed);
            await updateWalletInfo();
            localStorage.setItem('wallet_wif', walletWifOrSeed);
        } catch (e) {
            console.error(e);
            alert('Error loading wallet');
        }
        setLoading(false);
    };

    const handleCreate = async () => {
        setLoading(true);
        try {
            const walletDetails = await walletService.createWallet();
            setNewWallet(walletDetails);
        } catch (e) {
            console.error(e);
            alert('Error creating wallet');
        }
        setLoading(false);
    };

    const handleAcknowledge = () => {
        if (newWallet) {
            setWif(newWallet.wif);
            initializeWallet(newWallet.wif);
            setNewWallet(null);
        }
    };

    const handleImport = async () => {
        if (!wif) return;
        await initializeWallet(wif);
    };

    const handleDisconnect = () => {
        setAddress('');
        setWif('');
        setBalance(null);
        localStorage.removeItem('wallet_wif');
        window.location.reload();
    };

    const updateWalletInfo = async () => {
        const addr = await walletService.getAddress();
        const bal = await walletService.getBalance();
        setAddress(addr);
        setBalance(bal);
    };

    return (
        <div className="p-6 bg-gray-800 rounded-lg shadow-xl text-white max-w-md mx-auto mt-10">
            <h2 className="text-2xl font-bold mb-4">BCH Wallet (Chipnet)</h2>

            {newWallet ? (
                <NewWalletInfo wif={newWallet.wif} seed={newWallet.seed} onAcknowledge={handleAcknowledge} />
            ) : !address ? (
                <div className="space-y-4">
                    <button onClick={handleCreate} disabled={loading} className="w-full bg-green-500 hover:bg-green-600 py-2 rounded font-semibold transition">
                        {loading ? 'Creating...' : 'Create New Wallet'}
                    </button>
                    <div className="flex items-center my-2"><hr className="flex-grow border-gray-600" /><span className="px-2 text-gray-400">OR</span><hr className="flex-grow border-gray-600" /></div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Enter WIF or Seed Phrase"
                            value={wif}
                            onChange={(e) => setWif(e.target.value)}
                            className="flex-grow p-2 rounded bg-gray-700 border border-gray-600 focus:border-green-500 outline-none"
                        />
                        <button onClick={handleImport} disabled={loading} className="bg-blue-500 hover:bg-blue-600 px-4 rounded font-semibold transition">
                            Import
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="bg-gray-700 p-3 rounded break-all">
                        <p className="text-sm text-gray-400">Address</p>
                        <p className="font-mono text-green-400">{address}</p>
                    </div>
                    <div className="bg-gray-700 p-3 rounded">
                        <p className="text-sm text-gray-400">Balance</p>
                        <p className="text-xl font-bold">{balance?.bch} BCH</p>
                        <p className="text-sm text-gray-400">{balance?.sat} sats</p>
                    </div>
                    <div className="bg-gray-700 p-3 rounded break-all">
                        <p className="text-sm text-gray-400">Private Key (WIF) - SAVE THIS!</p>
                        <p className="font-mono text-red-400 text-xs">{wif}</p>
                    </div>
                    <button onClick={handleDisconnect} className="w-full bg-red-500 hover:bg-red-600 py-2 rounded font-semibold transition">
                        Disconnect
                    </button>
                </div>
            )}
        </div>
    );
};
