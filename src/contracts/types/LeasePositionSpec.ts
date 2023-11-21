import { Liability } from './Liability';
import { Asset } from './Asset';

export interface LeasePositionSpec {
    liability: Liability;
    min_asset: Asset;
    min_transaction: Asset;
}
