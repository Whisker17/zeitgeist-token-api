import { ApiPromise, WsProvider } from '@polkadot/api';
import { u32, u128, Option } from '@polkadot/types';
import { PalletBalancesAccountData } from '@polkadot/types/lookup';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { ISubmittableResult } from '@polkadot/types/types';
import { Header } from '@polkadot/types/interfaces';
import { networks } from '../const';
import BN from 'bn.js';
import { EraRewardAndStake } from '../types/dappStaking';
import { AprStats } from '../models/aprStats';

export type Transaction = SubmittableExtrinsic<'promise', ISubmittableResult>;

export interface IZeitgeistApi {
    getTotalSupply(): Promise<u128>;
    getBalances(addresses: string[]): Promise<PalletBalancesAccountData[]>;
    getChainDecimals(): Promise<number>;
    getChainName(): Promise<string>;
    getTvl(): Promise<BN>;
    getAprCalculationData(): Promise<AprStats>;
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

    public async getAprCalculationData(): Promise<AprStats> {
        await this.connect();
        const results = await Promise.all([
            this._api.consts.blockReward.rewardAmount,
            this._api.query.timestamp.now(),
            this._api.rpc.chain.getHeader(),
            this._api.consts.dappsStaking.developerRewardPercentage.toHuman(),
            this._api.consts.dappsStaking.blockPerEra,
        ]);

        const result = new AprStats();
        result.blockRewards = results[0] as u128;
        result.timeStamp = results[1];
        result.latestBlock = (results[2] as Header).number.unwrap();
        result.developerRewardPercentage = Number(results[3]?.toString().replace('%', '')) * 0.01;
        result.blockPerEra = results[4] as u32;

        return result;
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
