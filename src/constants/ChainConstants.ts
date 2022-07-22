export class ChainConstants {
    /* Coin configurations */
    public static readonly CHAIN_NAME: string = 'Nolus';
    public static readonly COIN_DENOM: string = 'nls';
    public static readonly COIN_MINIMAL_DENOM: string = 'unls';
    public static readonly COIN_DECIMALS: number = 6;
    public static readonly COIN_GECKO_ID: string = 'cosmos';
    public static readonly COIN_TYPE: number = 118;

    /* Chain configurations */
    public static readonly BECH32_PREFIX_ACC_ADDR: string = 'nolus';
    public static readonly BECH32_PREFIX_ACC_PUB: string = this.BECH32_PREFIX_ACC_ADDR + 'pub';
    public static readonly BECH32_PREFIX_VAL_ADDR: string = this.BECH32_PREFIX_ACC_ADDR + 'valoper';
    public static readonly BECH32_PREFIX_VAL_PUB: string = this.BECH32_PREFIX_ACC_ADDR + 'valoperpub';
    public static readonly BECH32_PREFIX_CONS_ADDR: string = this.BECH32_PREFIX_ACC_ADDR + 'valcons';
    public static readonly BECH32_PREFIX_CONS_PUB: string = this.BECH32_PREFIX_ACC_ADDR + 'valconspub';

    /* Wallet configurations */
    public static readonly BIP44_PATH: string = "44'/118'/0'/0/0";
}
