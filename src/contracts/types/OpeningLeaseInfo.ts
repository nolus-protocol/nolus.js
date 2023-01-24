import { Asset } from './Asset';
import { TransferOutOngoingState, BuyAssetOngoingState } from './ICAAccountOngoingStates';

export interface OpeningLeaseInfo {
    downpayment: Asset;
    loan: Asset;
    loan_interest_rate: number;
    in_progress: string | TransferOutOngoingState | BuyAssetOngoingState;
}
