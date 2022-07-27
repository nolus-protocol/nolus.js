import { Asset } from './Asset';

export interface LppBalance {
    balance: Asset;
    total_principal_due: Asset;
    total_interest_due: Asset;
    balance_nlpn: Asset;
}
