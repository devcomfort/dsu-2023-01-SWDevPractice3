import Koa from "koa";
import Router from "koa-router";
import Helmet from "koa-helmet";
import Logger from "koa-logger";
import BodyParser from "koa-bodyparser";

import RefreshLostsRouter from "./controllers/refresh-losts.js";
import QueryLostsRouter from "./controllers/query-losts.js";
import SubscriptionRouter from "./controllers/subscription.js";

const app = new Koa();
const router = new Router();

router.use(RefreshLostsRouter.routes());
router.use(QueryLostsRouter.routes());
router.use(SubscriptionRouter.routes());

app.use(router.routes());
app.use(Logger());
app.use(Helmet());
app.use(BodyParser());

app.listen(80, () => {
  console.log("80번 포트로 서버가 시작되었습니다!");
});
