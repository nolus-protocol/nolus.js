import { OpenedLeaseInfo } from './OpenedLeaseInfo';
import { OpeningLeaseInfo } from './OpeningLeaseInfo';
import { ClosingLeaseInfo } from './ClosingLeaseInfo';

export interface LeaseStatus {
    opening?: OpeningLeaseInfo;
    opened?: OpenedLeaseInfo;
    closing?: ClosingLeaseInfo;
    closed?: object;
    liquidated?: object;
}
