import React, { useState } from 'react';
import { walletService } from '../utils/bch';

export const MintForm: React.FC = () => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
    const [mediaUrl, setMediaUrl] = useState('');
    const [minting, setMinting] = useState(false);
    const [lastTokenId, setLastTokenId] = useState('');

    const handleMint = async () => {
        if (!name || !mediaUrl) {
            alert("Name and Media URL are required");
            return;
        }

        setMinting(true);
        try {
            // Pass empty string for the unused media type
            const imageUrl = mediaType === 'image' ? mediaUrl : '';
            const videoUrl = mediaType === 'video' ? mediaUrl : '';

            const tokenId = await walletService.mintNFT(name, description, imageUrl, videoUrl);
            setLastTokenId(tokenId);
            alert(`Minted successfully! Token ID: ${tokenId}`);
            // Clear form
            setName('');
            setDescription('');
            setMediaUrl('');
        } catch (e) {
            console.error(e);
            alert('Error minting NFT. Make sure you have funds (Chipnet BCH).');
        }
        setMinting(false);
    };

    return (
        <div className="p-6 bg-gray-800 rounded-lg shadow-xl text-white max-w-md mx-auto mt-6">
            <h2 className="text-2xl font-bold mb-4 text-green-400">Mint NFT</h2>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-green-500 outline-none"
                        placeholder="My Cool NFT"
                    />
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-1">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-green-500 outline-none"
                        placeholder="This is a rare item..."
                    />
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-2">Media Type</label>
                    <div className="flex gap-4 mb-2">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="radio"
                                checked={mediaType === 'image'}
                                onChange={() => setMediaType('image')}
                                className="mr-2"
                            />
                            Image / GIF
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="radio"
                                checked={mediaType === 'video'}
                                onChange={() => setMediaType('video')}
                                className="mr-2"
                            />
                            Video
                        </label>
                    </div>

                    <input
                        type="text"
                        value={mediaUrl}
                        onChange={(e) => setMediaUrl(e.target.value)}
                        className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-green-500 outline-none"
                        placeholder={mediaType === 'image' ? "https://i.imgur.com/..." : "https://example.com/video.mp4"}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        {mediaType === 'image' ? 'Supports JPG, PNG, GIF (Moving Images)' : 'Supports MP4, WebM (Max 5s recommended)'}
                    </p>
                </div>

                <button
                    onClick={handleMint}
                    disabled={minting}
                    className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded font-semibold transition disabled:opacity-50"
                >
                    {minting ? 'Minting...' : 'Mint NFT'}
                </button>

                {lastTokenId && (
                    <div className="mt-4 p-3 bg-gray-700 rounded break-all">
                        <p className="text-sm text-gray-400">Last Minted Token ID:</p>
                        <p className="font-mono text-green-400 text-xs">{lastTokenId}</p>
                        <a
                            href={`https://chipnet.chaingraph.cash/tx/${lastTokenId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-400 text-sm hover:underline block mt-1"
                        >
                            View on Explorer
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};
