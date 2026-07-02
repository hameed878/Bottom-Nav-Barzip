import { Router, type IRouter } from "express";
import healthRouter from "./health";
import fixturesRouter from "./fixtures";
import authRouter from "./auth";
import depositsRouter from "./deposits";
import transactionsRouter from "./transactions";
import walletsRouter from "./wallets";
import exchangeRouter from "./exchange";
import withdrawalsRouter from "./withdrawals";
import betsRouter from "./bets";
import agencyRouter from "./agency";
import walletRouter from "./wallet";
import vipRouter from "./vip";
import spinRouter from "./spin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(fixturesRouter);
router.use(authRouter);
router.use(depositsRouter);
router.use(transactionsRouter);
router.use(walletsRouter);
router.use(exchangeRouter);
router.use(withdrawalsRouter);
router.use(betsRouter);
router.use(agencyRouter);
router.use(walletRouter);
router.use(vipRouter);
router.use(spinRouter);

export default router;
