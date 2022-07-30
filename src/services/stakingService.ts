import { injectable, inject } from 'inversify';
import { aprToApy } from 'apr-tools';
import { IApiFactory } from '../client/apiFactory';
import { AprStats } from '../models/aprStats';
import { networks } from '../const';
import { getSubscanOption } from '../utils';
import axios from 'axios';
import { IZeitgeistApi, Transaction } from '../client/baseApi';
import { ContainerTypes } from '../containertypes';

export interface IStakingService {
    calculateApr(): Promise<number>;
    calculateApy(): Promise<number>;
    getEarned(address?: string): Promise<number>;
}

// Ref: https://github.com/PlasmNetwork/Astar/blob/5b01ef3c2ca608126601c1bd04270ed08ece69c4/runtime/shiden/src/lib.rs#L435
// Memo: 50% of block rewards goes to dappsStaking, 50% goes to block validator
const DAPPS_REWARD_RATE = 0.5;

const TS_FIRST_BLOCK = 1642041546; //  Ref: 2022-01-13 02:39:06  https://zeitgeist.subscan.io/block/1

@injectable()
/**
 * staking calculation service.
 */
export class StakingService implements IStakingService {
    constructor(@inject(ContainerTypes.ApiFactory) private _apiFactory: IApiFactory) {}

    public async calculateApr(): Promise<number> {
        try {
            const api = this._apiFactory.getApiInstance();
            const data = await api.getAprCalculationData();
            const decimals = await api.getChainDecimals();

            const blockRewards = Number(defaultAmountWithDecimals(data.blockRewards, decimals));
            const averageBlocksPerMinute =
                data.latestBlock.toNumber() / ((Math.floor(data.timeStamp.toNumber() / 1000) - TS_FIRST_BLOCK) / 60);
            const averageBlocksPerDay = averageBlocksPerMinute * 60 * 24;
            const dailyEraRate = averageBlocksPerDay / data.blockPerEra.toNumber();
            const eraRewards = data.blockPerEra.toNumber() * blockRewards;
            const annualRewards = eraRewards * dailyEraRate * 365.25;

            const tvl = await api.getTvl();

            console.log('blockRewards: ', blockRewards);
            console.log('averageBlocksPerMinute: ', averageBlocksPerMinute);
            console.log('averageBlocksPerDay: ', averageBlocksPerDay);
            console.log('dailyEraRate: ', dailyEraRate);
            console.log('eraRewards: ', eraRewards);
            console.log('annualRewards: ', annualRewards);
            console.log('tvl: ', tvl);

            return Number(tvl.toNumber);
            // const totalStaked = Number(ethers.utils.formatUnits(tvl.toString(), decimals));
            // const stakerBlockReward = (1 - data.developerRewardPercentage) * DAPPS_REWARD_RATE;
            // const stakerApr = (annualRewards / totalStaked) * stakerBlockReward * 100;

            // return stakerApr;
        } catch (e) {
            console.error(e);
            throw new Error(
                'Unable to calculate network APR. Most likely there is an error fetching data from a node.',
            );
        }
    }

    public async calculateApy(): Promise<number> {
        try {
            const apr = await this.calculateApr();
            return aprToApy(apr);
        } catch {
            throw new Error(
                'Unable to calculate network APY. Most likely there is an error fetching data from a node.',
            );
        }
    }

    public async getEarned(address: string): Promise<number> {
        try {
            // Docs: https://support.subscan.io/#staking-api
            const url = networks.zeitgeist.subscanUrl + '/api/scan/staking_history';
            const option = getSubscanOption();

            const body = {
                row: 20,
                page: 0,
                address,
            };

            const result = await axios.post(url, body, option);

            if (result.data) {
                const earned = result.data.data.sum;
                return earned;
                //return Number(ethers.utils.formatEther(earned));
            } else {
                return 0;
            }
        } catch (e) {
            console.error(e);
            throw new Error('Something went wrong. Most likely there is an error fetching data from Subscan API.');
        }
    }
}
