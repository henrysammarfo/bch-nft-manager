import React, { useEffect, useState } from 'react';
import { walletService } from '../utils/bch';

export const Gallery: React.FC = () => {
    const [nfts, setNfts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchNFTs = async () => {
        setLoading(true);
        try {
            const items = await walletService.getNFTs();
            setNfts(items);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchNFTs();
        const interval = setInterval(fetchNFTs, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="p-6 bg-gray-800 rounded-lg shadow-xl text-white max-w-4xl mx-auto mt-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-blue-400">My NFTs</h2>
                <button
                    onClick={fetchNFTs}
                    className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm"
                >
                    Refresh
                </button>
            </div>

            {loading && nfts.length === 0 && <p className="text-gray-400">Loading...</p>}

            {!loading && nfts.length === 0 && (
                <p className="text-gray-500 italic">No NFTs found in this wallet.</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nfts.map((nft) => {
                    const hasMetadata = nft.metadata !== null;
                    const hasCommitment = nft.token?.commitment;

                    return (
                        <div key={nft.token?.tokenId || Math.random()} className="bg-gray-700 rounded-lg overflow-hidden border border-gray-600 flex flex-col">
                            {/* Metadata Loading Error Badge */}
                            {!hasMetadata && hasCommitment && (
                                <div
                                    className="bg-yellow-600 text-yellow-100 text-xs px-3 py-1 flex items-center gap-2"
                                    title={nft.metadataError ? `Error: ${nft.metadataError.type}\nCID: ${nft.metadataError.cid}` : 'Metadata unavailable'}
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <span>
                                        {nft.metadataError ? `${nft.metadataError.type}: Metadata unavailable` : 'Metadata unavailable'}
                                    </span>
                                </div>
                            )}

                            {nft.metadata?.animation_url ? (
                                <div className="aspect-square w-full bg-black flex items-center justify-center overflow-hidden">
                                    <video
                                        src={nft.metadata.animation_url}
                                        controls
                                        autoPlay
                                        loop
                                        muted
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : nft.metadata?.image ? (
                                <div className="aspect-square w-full bg-black flex items-center justify-center overflow-hidden">
                                    <img
                                        src={nft.metadata.image}
                                        alt={nft.metadata.name}
                                        className="object-cover w-full h-full"
                                        onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/300?text=Error+Loading+Image')}
                                    />
                                </div>
                            ) : (
                                <div className="aspect-square w-full bg-gray-900 flex items-center justify-center">
                                    <div className="text-center p-4">
                                        <svg className="w-16 h-16 mx-auto text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <p className="text-gray-600 text-sm">No Media</p>
                                    </div>
                                </div>
                            )}

                            <div className="p-4 flex flex-col flex-grow">
                                <h3 className="font-bold text-lg truncate">{nft.metadata?.name || 'Unknown Token'}</h3>
                                <p className="text-gray-400 text-sm mb-2 line-clamp-2 flex-grow">{nft.metadata?.description || 'No description'}</p>

                                <div className="text-xs text-gray-500 font-mono truncate">
                                    ID: {nft.token?.tokenId}
                                </div>
                                {hasCommitment && (
                                    <div className="text-xs text-gray-500 font-mono mt-1 truncate" title={nft.token.commitment}>
                                        Commitment: {nft.token.commitment.substring(0, 20)}...
                                    </div>
                                )}

                                <div className="mt-3 pt-3 border-t border-gray-600">
                                    <ActionButtons nft={nft} onUpdate={fetchNFTs} hasMetadata={hasMetadata} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const ActionButtons: React.FC<{ nft: any, onUpdate: () => void, hasMetadata: boolean }> = ({ nft, onUpdate }) => {
    const [mode, setMode] = useState<'view' | 'edit' | 'transfer'>('view');

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to permanently delete this NFT? This action cannot be undone.')) {
            try {
                await walletService.burnNFT(nft);
                alert('NFT burned successfully!');
                onUpdate();
            } catch (e) {
                console.error(e);
                alert('Error burning NFT');
            }
        }
    };

    if (mode === 'edit') {
        return <EditNFT nft={nft} onUpdate={onUpdate} onCancel={() => setMode('view')} />;
    }

    if (mode === 'transfer') {
        return <TransferNFT nft={nft} onUpdate={onUpdate} onCancel={() => setMode('view')} />;
    }

    return (
        <div className="flex gap-2">
            <button onClick={() => setMode('edit')} className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-white">Edit</button>
            <button onClick={() => setMode('transfer')} className="text-xs bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-white">Transfer</button>
            <button onClick={handleDelete} className="text-xs bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-white">Delete</button>
        </div>
    );
};

const EditNFT: React.FC<{ nft: any, onUpdate: () => void, onCancel: () => void }> = ({ nft, onUpdate, onCancel }) => {
    const initialType = nft.metadata?.animation_url ? 'video' : 'image';
    const initialUrl = nft.metadata?.animation_url || nft.metadata?.image || '';

    const [name, setName] = useState(nft.metadata?.name || '');
    const [description, setDescription] = useState(nft.metadata?.description || '');
    const [mediaType, setMediaType] = useState<'image' | 'video'>(initialType);
    const [mediaUrl, setMediaUrl] = useState(initialUrl);
    const [updating, setUpdating] = useState(false);

    const handleUpdate = async () => {
        setUpdating(true);
        try {
            const newMetadata = {
                name,
                description,
                image: mediaType === 'image' ? mediaUrl : undefined,
                animation_url: mediaType === 'video' ? mediaUrl : undefined
            };

            await walletService.updateNFT(nft.token.tokenId, newMetadata);

            alert('NFT Updated Successfully!');
            onUpdate();
            onCancel();
        } catch (e) {
            console.error(e);
            alert('Error updating NFT');
        }
        setUpdating(false);
    };

    return (
        <div className="space-y-2 bg-gray-800 p-2 rounded border border-gray-600 mt-2">
            <div className="space-y-1">
                <label className="text-xs text-gray-400">Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs p-1 rounded bg-gray-900 border border-gray-500 text-white"
                    placeholder="Name"
                />
            </div>

            <div className="space-y-1">
                <label className="text-xs text-gray-400">Description</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full text-xs p-1 rounded bg-gray-900 border border-gray-500 text-white"
                    placeholder="Description"
                    rows={2}
                />
            </div>

            <div className="space-y-1">
                <label className="text-xs text-gray-400">Media</label>
                <div className="flex gap-2 text-xs text-gray-300 mb-1">
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="radio"
                            checked={mediaType === 'image'}
                            onChange={() => setMediaType('image')}
                            className="mr-1"
                        />
                        Image
                    </label>
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="radio"
                            checked={mediaType === 'video'}
                            onChange={() => setMediaType('video')}
                            className="mr-1"
                        />
                        Video
                    </label>
                </div>

                <input
                    type="text"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    className="w-full text-xs p-1 rounded bg-gray-900 border border-gray-500 text-white"
                    placeholder={mediaType === 'image' ? "Image URL" : "Video URL"}
                />
            </div>

            <div className="flex gap-2 pt-2">
                <button onClick={handleUpdate} disabled={updating} className="flex-1 text-xs bg-green-600 hover:bg-green-700 px-2 py-1 rounded">
                    {updating ? 'Saving...' : 'Save Changes'}
                </button>
                <button onClick={onCancel} className="text-xs bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded">
                    Cancel
                </button>
            </div>
        </div>
    );
};

const TransferNFT: React.FC<{ nft: any, onUpdate: () => void, onCancel: () => void }> = ({ nft, onUpdate, onCancel }) => {
    const [recipient, setRecipient] = useState('');
    const [transferring, setTransferring] = useState(false);

    const handleTransfer = async () => {
        if (!recipient) {
            alert('Please enter a recipient address.');
            return;
        }
        setTransferring(true);
        try {
            await walletService.transferNFT(recipient, nft.token.tokenId, nft.token.capability);
            alert('NFT transferred successfully!');
            onUpdate();
            onCancel();
        } catch (e) {
            console.error(e);
            alert('Error transferring NFT');
        }
        setTransferring(false);
    };

    return (
        <div className="space-y-2">
            <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full text-xs p-1 rounded bg-gray-900 border border-gray-500 text-white"
                placeholder="bchtest:q..."
            />
            <div className="flex gap-2 pt-2">
                <button onClick={handleTransfer} disabled={transferring} className="flex-1 text-xs bg-green-600 hover:bg-green-700 px-2 py-1 rounded">
                    {transferring ? 'Sending...' : 'Confirm Transfer'}
                </button>
                <button onClick={onCancel} className="text-xs bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded">
                    Cancel
                </button>
            </div>
        </div>
    );
};
