import { ApiPromise, WsProvider } from '@polkadot/api';
import { u128, Option } from '@polkadot/types';
import { PalletBalancesAccountData } from '@polkadot/types/lookup';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { ISubmittableResult } from '@polkadot/types/types';
import { networks } from '../const';
import BN from 'bn.js';
import { EraRewardAndStake } from '../types/dappStaking';

export type Transaction = SubmittableExtrinsic<'promise', ISubmittableResult>;

export interface IZeitgeistApi {
    getTotalSupply(): Promise<u128>;
    getBalances(addresses: string[]): Promise<PalletBalancesAccountData[]>;
    getChainDecimals(): Promise<number>;
    getChainName(): Promise<string>;
    getTvl(): Promise<BN>;
}

export class BaseApi implements IZeitgeistApi {
    protected _api: ApiPromise;

    constructor(private endpoints = networks.zeitgeist.endpoints) {}

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

    public async getTvl(): Promise<BN> {
        const era = await this._api.query.dappsStaking.currentEra();
        const result = await this._api.query.dappsStaking.eraRewardsAndStakes<Option<EraRewardAndStake>>(era);
        const tvl = result.unwrap().staked;
        return tvl;
    }

    protected async connect(index?: number): Promise<ApiPromise> {
        // establish node connection with the endpoints
        // support multi endpoints

        let apiNow: ApiPromise;
        const currentIndex = index ?? 0;

        if (!this._api || index) {
            const provider = new WsProvider(this.endpoints[currentIndex]);
            apiNow = new ApiPromise({ provider });
        } else {
            apiNow = this._api;
        }

        return await apiNow.isReadyOrError.then(
            (api: ApiPromise) => {
                // succeed
                this._api = api;
                return api;
            },
            async () => {
                // fail
                apiNow.disconnect();
                const nextNetworkIndex = this.getNexttNetwork(currentIndex);
                console.warn(
                    `Connection to ${this.endpoints[currentIndex]} failed. Try ${this.endpoints[nextNetworkIndex]}`,
                );

                return await this.connect(nextNetworkIndex);
            },
        );
    }

    private getNexttNetwork(index: number): number {
        return (index + 1) % this.endpoints.length;
    }
}
