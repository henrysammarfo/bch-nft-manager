# BCH NFT Manager

A Bitcoin Cash (BCH) NFT management application built with React, TypeScript, and mainnet-js. Mint, view, and update mutable CashToken NFTs on the BCH Chipnet (testnet).

## Features

- 🔐 **Wallet Management**: Create or import BCH testnet wallets
- 🎨 **NFT Minting**: Create mutable NFTs with image or video metadata
- 🖼️ **NFT Gallery**: View all your minted NFTs with rich media support
- ✏️ **NFT Updates**: Update NFT commitment and metadata (requires 'minting' capability)
- ⚡ **Real-time Updates**: See NFTs immediately, even before blockchain confirmation

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS v4
- **Blockchain**: Bitcoin Cash Chipnet (Testnet)
- **Library**: mainnet-js for BCH interactions
- **Storage**: LocalStorage for wallet persistence and metadata

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- BCH testnet tokens (get from a Chipnet faucet)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Usage

1. **Create/Import Wallet**: Generate a new testnet wallet or import existing WIF
2. **Get Testnet BCH**: Use a Chipnet faucet to fund your wallet
3. **Mint NFT**: Fill in metadata (name, description, image/video URL) and mint
4. **View Gallery**: See all your NFTs with their metadata
5. **Update NFT**: Edit NFT details and update on-chain (new NFTs only)

## Important Notes

- **Testnet Only**: This app uses BCH Chipnet - DO NOT use mainnet wallets
- **Local Metadata**: NFT metadata is stored locally (simulating BCMR)
- **Minting Capability**: New NFTs use 'minting' capability to enable updates
- **Old NFTs**: NFTs minted with 'mutable' capability cannot be updated via this app

## Project Structure

```
src/
├── components/
│   ├── WalletConnect.tsx   # Wallet creation/import UI
│   ├── MintForm.tsx         # NFT minting form
│   └── Gallery.tsx          # NFT display and editing
├── utils/
│   └── bch.ts              # BCH/NFT logic (WalletService)
└── App.tsx                 # Main app component
```

## License

MIT
