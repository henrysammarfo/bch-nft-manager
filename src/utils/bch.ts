import { TestNetWallet, Config } from 'mainnet-js';
import axios from 'axios';

// @ts-expect-error mainnet-js is not fully typed
Config.EnforceCashToken = true;

const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

const toHex = (str: string) => Buffer.from(str, 'utf8').toString('hex');

const fromHex = (hex: string) => Buffer.from(hex, 'hex').toString('utf8');


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

    async mintNFT(name: string, description: string, imageUrl: string, videoUrl?: string): Promise<string> {
        if (!this.wallet) throw new Error("Wallet not initialized");

        const metadata = {
            name,
            description,
            image: imageUrl,
            ...(videoUrl && { animation_url: videoUrl })
        };

        const ipfsCid = await this.uploadToIPFS(metadata);
        const commitment = toHex(ipfsCid).substring(0, 40);

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

            if (commitment) {
                try {
                    const ipfsCid = fromHex(commitment);
                    const response = await axios.get(`${IPFS_GATEWAY}${ipfsCid}`);
                    metadata = response.data;
                } catch (e) {
                    console.error("Failed to fetch or parse metadata from IPFS", e);
                }
            }

            return {
                ...utxo,
                metadata
            };
        }));

        return nfts;
    }

    async updateNFT(tokenId: string, newMetadata: any): Promise<string> {
        if (!this.wallet) throw new Error("Wallet not initialized");

        const newIpfsCid = await this.uploadToIPFS(newMetadata);
        const newCommitment = toHex(newIpfsCid).substring(0, 40);

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
