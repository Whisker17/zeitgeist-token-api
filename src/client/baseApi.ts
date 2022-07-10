import { ApiPromise, WsProvider } from '@polkadot/api';
import { u128 } from '@polkadot/types';
import { PalletBalancesAccountData } from '@polkadot/types/lookup';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { ISubmittableResult } from '@polkadot/types/types';
import { networks } from '../const';

export type Transaction = SubmittableExtrinsic<'promise', ISubmittableResult>;

export interface IZeitgeistApi {
    getTotalSupply(): Promise<u128>;
    getBalances(addresses: string[]): Promise<PalletBalancesAccountData[]>;
    getChainDecimals(): Promise<number>;
    getChainName(): Promise<string>;
}

export class BaseApi implements IZeitgeistApi {
    protected _api: ApiPromise;

    constructor(private endpoint = networks.zeitgeist.endpoint) {}

    public async getTotalSupply(): Promise<u128> {
        await this.connect();

        return await this._api.query.balances.totalIssuance();
    }

    public async getBalances(addresses: string[]): Promise<PalletBalancesAccountData[]> {
        await this.connect();
        const balances = await this._api.query.system.account.multi(addresses);

        return balances.map((balance) => balance.data);
    }

    public async getChainDecimals(): Promise<number> {
        await this.connect();
        const decimals = this._api.registry.chainDecimals;

        return decimals[0];
    }

    public async getChainName(): Promise<string> {
        await this.connect();

        return (await this._api.rpc.system.chain()).toString();
    }

    protected async connect() {
        // establish node connection with the endpoint
        if (!this._api) {
            const provider = new WsProvider(this.endpoint);
            const api = new ApiPromise({ provider });
            this._api = await api.isReady;
        }

        return this._api;
    }
}
