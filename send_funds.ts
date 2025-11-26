import { TestNetWallet } from 'mainnet-js';

async function sendFunds() {
    const wif = 'cP7g4BVepdXoTcmWKbhBCeUswRByX5wP3g3V4YmbB9WAsckNYC3c';
    const recipientAddress = 'bchtest:qq63ft0xgthn8hpgu40d0cr29aq2asy8jgwhmwn9kv';

    try {
        const wallet = await TestNetWallet.fromWIF(wif);
        const result = await wallet.sendMax(recipientAddress);
        console.log(`Transaction successful. Transaction ID: ${result.txId}`);
    } catch (error) {
        console.error('Error sending funds:', error);
    }
}

sendFunds();
