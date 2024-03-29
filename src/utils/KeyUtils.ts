import { Bip39, EnglishMnemonic, HdPath, Random, ripemd160, Secp256k1, sha256, Slip10, Slip10Curve } from '@cosmjs/crypto';
import { toBech32, fromBech32 } from '@cosmjs/encoding';
import { ChainConstants } from '../constants';

/**
 * KeyUtils provides helpers for working with Nolus accounts.
 */
export class KeyUtils {
    public static async getPrivateKeyFromMnemonic(mnemonic: string, hdPath: HdPath) {
        const seed = await this.getSeedFromMnemonic(mnemonic);
        return this.getPrivateKeyFromSeed(seed, hdPath);
    }

    public static async getSeedFromMnemonic(mnemonic: string) {
        const mnemonicChecked = new EnglishMnemonic(mnemonic);
        return Bip39.mnemonicToSeed(mnemonicChecked);
    }

    public static getPrivateKeyFromSeed(seed: Uint8Array, hdPath: HdPath) {
        const { privkey } = Slip10.derivePath(Slip10Curve.Secp256k1, seed, hdPath);
        return privkey;
    }

    public static getAddressFromPublicKey(publicKey: Uint8Array, prefix = ChainConstants.BECH32_PREFIX_ACC_ADDR) {
        if (publicKey.length !== 33) {
            throw new Error(`Invalid Secp256k1 pubkey length (compressed): ${publicKey.length}`);
        }
        const hash1 = sha256(publicKey);
        const hash2 = ripemd160(hash1);
        return toBech32(prefix, hash2);
    }

    public static async getPublicKeyFromPrivateKey(privateKey: Uint8Array) {
        const { pubkey } = await Secp256k1.makeKeypair(privateKey);
        return Secp256k1.compressPubkey(pubkey);
    }

    public static isAddressValid(address: string, prefix = ChainConstants.BECH32_PREFIX_ACC_ADDR): boolean {
        try {
            const decoded = fromBech32(address);
            return (!prefix || prefix === decoded.prefix) && decoded.data.length === 20;
        } catch (err) {
            return false;
        }
    }

    public static generateMnemonic(): string {
        const entropy = Random.getBytes(32);
        const mnemonic = Bip39.encode(entropy);
        return mnemonic.toString();
    }
}
