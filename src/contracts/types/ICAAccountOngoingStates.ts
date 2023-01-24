type ICAAccountOngoingState = {
    ica_account: string;
};

export interface TransferOutOngoingState {
    transfer_out: ICAAccountOngoingState;
}

export interface BuyAssetOngoingState {
    buy_asset: ICAAccountOngoingState;
}
