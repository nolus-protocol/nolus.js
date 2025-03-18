import { OpenedLeaseInfo } from './OpenedLeaseInfo';
import { OpeningLeaseInfo } from './OpeningLeaseInfo';
import { PaidLeaseInfo } from './PaidLeaseInfo';

export interface LeaseStatus {
    opening?: OpeningLeaseInfo;
    opened?: OpenedLeaseInfo;
    paid?: PaidLeaseInfo;
    closed?: object;
    liquidated?: object;
}
