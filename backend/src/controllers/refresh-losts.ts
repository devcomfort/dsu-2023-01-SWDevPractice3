import { queryAll as busanQueryAll } from "crawler-busan/src/query.js";
import { queryAll as seoulQueryAll } from "crawler-seoul/src/query.js";
import bodyParser from "koa-bodyparser";

import Router from "koa-router";
import { insertLosts } from "../services/losts.js";

const router = new Router();

router.use(bodyParser());

router.get("/busan", async (ctx, next) => {
  const queryResults = await busanQueryAll(20);
  await insertLosts(
    queryResults.losts.map((l) => {
      return {
        name: l.name,
        category: l.category,
        state: l.state,
        when_found: new Date(l.whenFound),
        where_found: l.whereFound,
        province: "부산",
      };
    })
  );
  ctx.body = "부산 지역의 신규 유실물 데이터가 추가되었습니다!";
});

router.get("/seoul", async (ctx, next) => {
  const queryResults = await seoulQueryAll(20);
  await insertLosts(
    queryResults.losts.map((l) => {
      return {
        name: l.name,
        category: l.category,
        state: l.state,
        when_found: new Date(l.whenFound),
        where_found: l.whereFound,
        province: "서울",
      };
    })
  );
  ctx.body = "서울 지역의 신규 유실물 데이터가 추가되었습니다!";
});

export default router;
