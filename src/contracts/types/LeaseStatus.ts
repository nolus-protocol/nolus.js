import { LeaseInfo } from './LeaseInfo';
import { Asset } from './Asset';

export interface LeaseStatus {
    opened?: LeaseInfo;
    closed?: object;
    paid?: Asset;
}
