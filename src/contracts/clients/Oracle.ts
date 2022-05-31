import { Prices } from '../types';
import { NolusClient } from '../../client';
import { getPrices } from '../messages/OracleMsg';

export class Oracle {
    public async getPrices(contractAddress: string, denoms: string[]): Promise<Prices> {
        const cosm = await NolusClient.getInstance().getCosmWasmClient();
        return await cosm.queryContractSmart(contractAddress, getPrices(denoms));
    }
}
