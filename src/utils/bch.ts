import { TestNetWallet, Config } from 'mainnet-js';
import axios from 'axios';
import { CID } from 'multiformats/cid';

// @ts-expect-error mainnet-js is not fully typed
Config.EnforceCashToken = true;

const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
// Use Pinata's dedicated gateway for better reliability
const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

// Convert IPFS CID to hex-encoded bytes for commitment (stays within 40-byte limit)
const cidToHex = (cidString: string): string => {
    const cid = CID.parse(cidString);
    // Get the raw bytes of the CID (34 bytes for CIDv0)
    return Buffer.from(cid.bytes).toString('hex');
};

// Convert hex-encoded CID bytes back to CID string
const hexToCid = (hex: string): string => {
    const bytes = Buffer.from(hex, 'hex');
    const cid = CID.decode(bytes);
    return cid.toString();
};


export class WalletService {
    private wallet: TestNetWallet | null = null;

    async createWallet(): Promise<{ wif: string, seed: string }> {
        this.wallet = await TestNetWallet.newRandom();
        const walletDetails = this.wallet as TestNetWallet & { privateKeyWif?: string, getWif?: () => string, mnemonic?: string };
        const wif: string | undefined = walletDetails.privateKeyWif || walletDetails.getWif?.();
        const seed: string | undefined = walletDetails.mnemonic;

        if (!wif || !seed) {
            throw new Error("Wallet creation failed, could not retrieve WIF or seed phrase.");
        }

        return { wif, seed };
    }

    async importWallet(wifOrSeed: string): Promise<void> {
        if (wifOrSeed.split(' ').length > 1) {
            this.wallet = await TestNetWallet.fromSeed(wifOrSeed);
        } else {
            this.wallet = await TestNetWallet.fromWIF(wifOrSeed);
        }
    }

    async getAddress(): Promise<string> {
        if (!this.wallet) throw new Error("Wallet not initialized");
        // @ts-expect-error mainnet-js is not fully typed
        return this.wallet.cashaddr || this.wallet.getCashaddr?.();
    }

    async getBalance(): Promise<any> {
        if (!this.wallet) throw new Error("Wallet not initialized");
        return this.wallet.getBalance();
    }

    getWalletInstance(): TestNetWallet | null {
        return this.wallet;
    }

    private async uploadToIPFS(metadata: any): Promise<string> {
        if (!PINATA_JWT) {
            throw new Error("VITE_PINATA_JWT is not set in .env file");
        }

        const response = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', metadata, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${PINATA_JWT}`
            }
        });

        return response.data.IpfsHash;
    }

    async consolidateUTXOs(): Promise<string> {
        if (!this.wallet) throw new Error("Wallet not initialized");

        // @ts-expect-error mainnet-js is not fully typed
        const walletAddr = this.wallet.cashaddr || this.wallet.getCashaddr?.();

        const result = await this.wallet.sendMax(walletAddr);
        return result.txId || "";
    }

    async mintNFT(name: string, description: string, imageUrl: string, videoUrl?: string): Promise<string> {
        if (!this.wallet) throw new Error("Wallet not initialized");

        // First, try to consolidate UTXOs to ensure we have a vout=0 UTXO
        try {
            await this.consolidateUTXOs();
            // Wait a moment for the transaction to process
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (e) {
            console.warn("UTXO consolidation failed, proceeding anyway:", e);
        }

        const metadata = {
            name,
            description,
            image: imageUrl,
            ...(videoUrl && { animation_url: videoUrl })
        };

        const ipfsCid = await this.uploadToIPFS(metadata);

        // Store CID as raw bytes (34 bytes for CIDv0, well within 40-byte limit)
        const commitment = cidToHex(ipfsCid);

        // @ts-expect-error mainnet-js is not fully typed
        const walletAddr = this.wallet.cashaddr || this.wallet.getCashaddr?.();

        const result = await this.wallet.tokenGenesis({
            cashaddr: walletAddr,
            amount: 0n,
            capability: 'minting',
            commitment: commitment,
            value: 1000,
        });

        return result.tokenIds?.[0] || "";
    }

    async getNFTs(): Promise<any[]> {
        if (!this.wallet) return [];

        const allUtxos = await this.wallet.getUtxos();
        const tokenUtxos = allUtxos.filter((u: any) => u.token);

        const nfts = await Promise.all(tokenUtxos.map(async (utxo: any) => {
            const commitment = utxo.token?.commitment;
            let metadata = null;
            let metadataError = null;

            if (commitment) {
                try {
                    // Decode CID from hex-encoded bytes
                    const ipfsCid = hexToCid(commitment);

                    // Fetch metadata from IPFS with timeout
                    const response = await axios.get(`${IPFS_GATEWAY}${ipfsCid}`, {
                        timeout: 10000 // 10 second timeout
                    });
                    metadata = response.data;
                } catch (e: any) {
                    // Provide detailed error information
                    const errorType = e.code === 'ECONNABORTED' ? 'Timeout' :
                        e.response?.status === 404 ? 'Not Found' :
                            e.response?.status === 500 ? 'Gateway Error' :
                                'Network Error';

                    metadataError = {
                        type: errorType,
                        message: e.message,
                        cid: hexToCid(commitment)
                    };

                    console.warn(`[NFT ${utxo.token?.tokenId}] Failed to load metadata:`, {
                        error: errorType,
                        cid: metadataError.cid,
                        details: e.message
                    });
                }
            }

            return {
                ...utxo,
                metadata,
                metadataError
            };
        }));

        return nfts;
    }

    async updateNFT(tokenId: string, newMetadata: any): Promise<string> {
        if (!this.wallet) throw new Error("Wallet not initialized");

        const newIpfsCid = await this.uploadToIPFS(newMetadata);
        // Store CID as raw bytes
        const newCommitment = cidToHex(newIpfsCid);

        // @ts-expect-error mainnet-js is not fully typed
        const addr = this.wallet.cashaddr || this.wallet.getCashaddr?.();

        const result = await this.wallet.tokenMint(
            tokenId,
            [{
                cashaddr: addr,
                commitment: newCommitment,
                capability: 'minting',
                value: 1000
            }]
        );

        return result.txId || "";
    }

    async burnNFT(nft: any): Promise<string> {
        if (!this.wallet) throw new Error("Wallet not initialized");

        const result = await this.wallet.tokenBurn(
            {
                tokenId: nft.token.tokenId,
                capability: nft.token.capability,
                commitment: nft.token.commitment,
            },
            "burn",
        );

        if (!result.txId) {
            throw new Error("Burn transaction failed, no txId returned");
        }
        return result.txId;
    }

    async transferNFT(recipientAddress: string, tokenId: string): Promise<string> {
        if (!this.wallet) throw new Error("Wallet not initialized");

        const result = await this.wallet.send([
            {
                cashaddr: recipientAddress,
                value: 1000,
                unit: 'sat',
                tokenId: tokenId,
            },
        ]);

        if (!result.txId) {
            throw new Error("Transfer transaction failed, no txId returned");
        }
        return result.txId;
    }
}

export const walletService = new WalletService();
