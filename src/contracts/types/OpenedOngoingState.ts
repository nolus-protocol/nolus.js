import { LiquidationOngoingState } from './LiquidationOngoingState';
import { RepaymentOngoingState } from './RepaymentOngoingState';
import { CloseOngoingState } from './CloseOngoingState';

export interface OpenedOngoingState {
    in_progress?: RepaymentOngoingState | LiquidationOngoingState | CloseOngoingState;
}
