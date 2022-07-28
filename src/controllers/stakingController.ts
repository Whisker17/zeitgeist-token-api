import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { injectable, inject } from 'inversify';
import { ContainerTypes } from '../containertypes';
import { IStakingService } from '../services/stakingService';
import { IStatsIndexerService, PeriodType } from '../services/statsIndexer';
import { ControllerBase } from './controllerBase';
import { IControllerBase } from './iControllerBase';

@injectable()
export class StakingController extends ControllerBase implements IControllerBase {
    constructor(
        @inject(ContainerTypes.DappsStakingService) private _stakingService: IStakingService,
        @inject(ContainerTypes.StatsIndexerService) private _indexerService: IStatsIndexerService,
    ) {
        super();
    }

    public register(app: express.Application): void {
        /**
         * @description staking APR route
         */
        app.route('/api/v1/staking/apr').get(async (req: Request, res: Response) => {
            /*
                #swagger.description = 'Query APR'
            */
            try {
                res.json(await this._stakingService.calculateApr());
            } catch (err) {
                this.handleError(res, err as Error);
            }
        });

        /**
         * @description staking APY route
         */
        app.route('/api/v1/staking/apy').get(async (req: Request, res: Response) => {
            /*
                #swagger.description = 'Query APY'
            */
            try {
                res.json(await this._stakingService.calculateApy());
            } catch (err) {
                this.handleError(res, err as Error);
            }
        });

        /**
         * @description staking TVL route v1.
         */
        app.route('/api/v1/dapps-staking/tvl/:period').get(async (req: Request, res: Response) => {
            /*
                #swagger.description = 'Query TVL in a specific period'
                #swagger.parameters['period'] = {
                    in: 'path',
                    description: 'The period type. Supported values: 7 days 30 days, 90 days, 1 year',
                    required: true,
                }
            */
            res.json(await this._indexerService.getDappStakingTvl(req.params.period as PeriodType));
        });

        /**
         * @description staking rewards route v1.
         */
        app.route('/api/v1/dapps-staking/earned/:address').get(async (req: Request, res: Response) => {
            /*
                #swagger.description = 'Query staking rewards for a specific address'
                #swagger.parameters['address'] = {
                    in: 'path',
                    description: 'Wallet address. Supported address format: SS58',
                    required: true,
                }
            */
            res.json(await this._stakingService.getEarned(req.params.address as string));
        });
    }
}
