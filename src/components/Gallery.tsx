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
                {nfts.map((nft) => (
                    <div key={nft.token?.tokenId || Math.random()} className="bg-gray-700 rounded-lg overflow-hidden border border-gray-600">
                        {nft.metadata?.videoUrl ? (
                            <div className="aspect-square w-full bg-black flex items-center justify-center overflow-hidden">
                                <video
                                    src={nft.metadata.videoUrl}
                                    controls
                                    autoPlay
                                    loop
                                    muted
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ) : nft.metadata?.imageUrl ? (
                            <div className="aspect-square w-full bg-black flex items-center justify-center overflow-hidden">
                                <img
                                    src={nft.metadata.imageUrl}
                                    alt={nft.metadata.name}
                                    className="object-cover w-full h-full"
                                    onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/300?text=Error+Loading+Image')}
                                />
                            </div>
                        ) : (
                            <div className="aspect-square w-full bg-gray-900 flex items-center justify-center text-gray-600">
                                No Media
                            </div>
                        )}

                        <div className="p-4">
                            <h3 className="font-bold text-lg truncate">{nft.metadata?.name || 'Unknown Token'}</h3>
                            <p className="text-gray-400 text-sm mb-2 line-clamp-2">{nft.metadata?.description || 'No description'}</p>

                            <div className="text-xs text-gray-500 font-mono truncate">
                                ID: {nft.token?.tokenId}
                            </div>
                            <div className="text-xs text-gray-500 font-mono mt-1">
                                Commitment: {nft.token?.commitment || 'None'}
                            </div>

                            <div className="mt-3 pt-3 border-t border-gray-600">
                                <EditNFT nft={nft} onUpdate={fetchNFTs} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const EditNFT: React.FC<{ nft: any, onUpdate: () => void }> = ({ nft, onUpdate }) => {
    const [editing, setEditing] = useState(false);
    // Determine initial state based on what exists
    const initialType = nft.metadata?.videoUrl ? 'video' : 'image';
    const initialUrl = nft.metadata?.videoUrl || nft.metadata?.imageUrl || '';

    const [name, setName] = useState(nft.metadata?.name || '');
    const [description, setDescription] = useState(nft.metadata?.description || '');
    const [mediaType, setMediaType] = useState<'image' | 'video'>(initialType);
    const [mediaUrl, setMediaUrl] = useState(initialUrl);
    const [updating, setUpdating] = useState(false);

    if (!editing) {
        return (
            <button
                onClick={() => setEditing(true)}
                className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-white"
            >
                Edit / Update
            </button>
        );
    }

    const handleUpdate = async () => {
        setUpdating(true);
        try {
            const newCommitment = Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0');

            const newMetadata = {
                ...nft.metadata,
                name,
                description,
                imageUrl: mediaType === 'image' ? mediaUrl : '',
                videoUrl: mediaType === 'video' ? mediaUrl : ''
            };

            await walletService.updateNFT(nft.token.tokenId, newCommitment, newMetadata);

            alert(`Updated! New Commitment: ${newCommitment}`);
            setEditing(false);
            onUpdate();
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
                <button
                    onClick={handleUpdate}
                    disabled={updating}
                    className="flex-1 text-xs bg-green-600 hover:bg-green-700 px-2 py-1 rounded"
                >
                    {updating ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                    onClick={() => setEditing(false)}
                    className="text-xs bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};
