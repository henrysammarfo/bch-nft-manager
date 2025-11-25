import { TestNetWallet, Config } from 'mainnet-js';

// @ts-ignore
Config.EnforceCashToken = true;

export class WalletService {
    private wallet: TestNetWallet | null = null;

    async createWallet(): Promise<string> {
        this.wallet = await TestNetWallet.newRandom();
        // @ts-ignore
        return (this.wallet as any).privateKeyWif || (this.wallet as any).getWif?.();
    }

    async importWallet(wif: string): Promise<void> {
        this.wallet = await TestNetWallet.fromWIF(wif);
    }

    async getAddress(): Promise<string> {
        if (!this.wallet) throw new Error("Wallet not initialized");
        // @ts-ignore
        return this.wallet.cashaddr || this.wallet.getCashaddr?.();
    }

    async getBalance(): Promise<any> {
        if (!this.wallet) throw new Error("Wallet not initialized");
        return this.wallet.getBalance();
    }

    getWalletInstance(): TestNetWallet | null {
        return this.wallet;
    }

    async mintNFT(name: string, description: string, imageUrl: string, videoUrl?: string): Promise<string> {
        if (!this.wallet) throw new Error("Wallet not initialized");

        // @ts-ignore
        const walletAddr = this.wallet.cashaddr || this.wallet.getCashaddr?.();

        const result = await this.wallet.tokenGenesis({
            cashaddr: walletAddr,
            amount: 0n,
            capability: 'minting',  // Use 'minting' to allow updates via tokenMint()
            commitment: '00',
            value: 1000,
        });

        const tokenId = result.tokenIds?.[0];
        if (tokenId) {
            this.saveLocalMetadata(tokenId, { name, description, imageUrl, videoUrl });
        }

        return tokenId || "";
    }

    private saveLocalMetadata(tokenId: string, metadata: any) {
        const existing = JSON.parse(localStorage.getItem('nft_metadata') || '{}');
        existing[tokenId] = metadata;
        localStorage.setItem('nft_metadata', JSON.stringify(existing));
    }

    getLocalMetadata(tokenId: string) {
        const existing = JSON.parse(localStorage.getItem('nft_metadata') || '{}');
        return existing[tokenId];
    }

    async getNFTs(): Promise<any[]> {
        if (!this.wallet) return [];

        // Get all token UTXOs
        const utxos = await this.wallet.getTokenUtxos();
        console.log("Raw Token UTXOs:", utxos);

        // Also check all UTXOs (including unconfirmed)
        const allUtxos = await this.wallet.getUtxos();
        console.log("ALL UTXOs (including unconfirmed):", allUtxos);

        // Filter for token UTXOs from all UTXOs
        const tokenUtxosFromAll = allUtxos.filter((u: any) => u.token);
        console.log("Token UTXOs from ALL:", tokenUtxosFromAll);

        // Use whichever has more results
        const finalUtxos = tokenUtxosFromAll.length > 0 ? tokenUtxosFromAll : utxos;

        const nfts = finalUtxos.map((utxo: any) => {
            const tokenId = utxo.token?.tokenId;
            const metadata = tokenId ? this.getLocalMetadata(tokenId) : null;
            console.log(`Token ${tokenId}:`, metadata);
            return {
                ...utxo,
                metadata
            };
        });

        console.log("Processed NFTs:", nfts);
        return nfts;
    }

    async updateNFT(tokenId: string, newCommitment: string, newMetadata?: any): Promise<string> {
        if (!this.wallet) throw new Error("Wallet not initialized");

        console.log("Attempting to update NFT:", tokenId);

        // Get wallet address
        // @ts-ignore
        const addr = this.wallet.cashaddr || this.wallet.getCashaddr?.();

        try {
            // Use tokenMint to create ONE new NFT with updated commitment
            // This consumes the old NFT and creates exactly one new one
            const result = await this.wallet.tokenMint(
                tokenId,  // category ID (same as the token we're updating)
                [{
                    cashaddr: addr,
                    commitment: newCommitment,
                    capability: 'minting',  // Keep minting capability for future updates
                    value: 1000
                }]
            );

            console.log("Update result:", result);
            const txId = result.txId;
            console.log("Update Transaction ID:", txId);

            // Update local metadata if provided
            if (newMetadata) {
                this.saveLocalMetadata(tokenId, newMetadata);
            }

            return txId || "";
        } catch (error) {
            console.error("Transaction Failed:", error);
            throw error;
        }
    }
}

export const walletService = new WalletService();
