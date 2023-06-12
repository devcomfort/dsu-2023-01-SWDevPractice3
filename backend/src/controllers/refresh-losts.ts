import { queryAll as busanQueryAll } from "crawler-busan/src/query.js";
import { queryAll as seoulQueryAll } from "crawler-seoul/src/query.js";
import bodyParser from "koa-bodyparser";
import { PrismaClient } from "@prisma/client";

import Router from "koa-router";
import { insertLosts } from "../services/losts.js";

interface QueryParams {
  name?: string;
  category?: string;
  where_found?: string;
  startDt?: string;
  endDt?: string;
  state?: string;
  // province: string
}

const prisma = new PrismaClient();

const router = new Router();

router.use(bodyParser());

// 공통: 놀이공원 지점 ENUM 반환
router.get("/enums/province", async (ctx, next) => {
  const enums = await prisma.losts.findMany({
    distinct: ["province"],
    select: {
      province: true,
    },
  });

  const provinces = enums.map((v) => v.province);

  // string[] 형태로 응답 보내기
  ctx.body = {
    provinces,
    length: provinces.length,
  };
});

// 유실물 분류 ENUM 반환
router.get("/busan/enums/category", async (ctx, next) => {
  const enums = await prisma.losts.findMany({
    where: {
      province: "부산",
    },
    distinct: ["category"],
    select: {
      category: true,
    },
  });

  const categories = enums.map((v) => v.category);
  // string[] 형태로 응답 내보내기
  ctx.body = {
    categories,
    length: categories.length,
  };
});
// 발견위치(놀이기구) ENUM 반환
router.get("/busan/enums/spot", async (ctx, next) => {
  const enums = await prisma.losts.findMany({
    distinct: ["where_found"],
    where: {
      province: "부산",
    },
    select: {
      where_found: true,
    },
  });

  const spots = enums.map((v) => v.where_found);

  ctx.body = {
    spots,
    length: spots.length,
  };
});

// 현재 상태 ENUM 반환
router.get("/busan/enums/state", async (ctx, next) => {
  const enums = await prisma.losts.findMany({
    distinct: ["state"],
    select: {
      state: true,
    },
    where: {
      province: "부산",
    },
  });

  const states = enums.map((v) => v.state);

  // string[] 형태로 응답 보내기
  ctx.body = {
    states,
    length: states.length,
  };
});

router.get("/busan", async (ctx, next) => {
  const query = ctx.query as QueryParams;

  // TODO: 시간 정보에 따라 데이터를 하나만 남길 수 있도록 질의를 수정해야함
  // TODO: 서울 지점도.
  const result = await prisma.losts.findMany({
    // 최대한 중복 데이터 거르기
    distinct: ["name", "province", "category", "when_found", "where_found"],
    where: {
      name: {
        contains: query.name,
      },
      category: {
        equals: query.category,
      },
      state: {
        equals: query.state,
      },
      where_found: {
        equals: query.where_found,
      },
      when_found: {
        gte: query.startDt && new Date(query.startDt),
        lte: query.endDt && new Date(query.endDt),
      },
      province: {
        equals: "부산",
      },
    },
  });

  ctx.body = result;
});

/** 부산 지점 유실물 데이터 갱신 라우터 */
router.post("/busan", async (ctx, next) => {
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

// 유실물 분류 ENUM 반환
router.get("/seoul/enums/category", async (ctx, next) => {
  const enums = await prisma.losts.findMany({
    where: {
      province: "서울",
    },
    distinct: ["category"],
    select: {
      category: true,
    },
  });

  const categories = enums.map((v) => v.category);

  // string[] 형태로 응답 내보내기
  ctx.body = {
    categories,
    length: categories.length,
  };
});

// 발견위치(놀이기구) ENUM 반환
router.get("/seoul/enums/spot", async (ctx, next) => {
  const enums = await prisma.losts.findMany({
    distinct: ["where_found"],
    where: {
      province: "서울",
    },
    select: {
      where_found: true,
    },
  });

  const spots = enums.map((v) => v.where_found);

  ctx.body = {
    spots,
    length: spots.length,
  };
});

// 현재 상태 ENUM 반환
router.get("/seoul/enums/state", async (ctx, next) => {
  const enums = await prisma.losts.findMany({
    distinct: ["state"],
    where: {
      province: "서울",
    },
    select: {
      where_found: true,
    },
  });

  const spots = enums.map((v) => v.where_found);

  ctx.body = {
    spots,
    length: spots.length,
  };
});

router.get("/seoul", async (ctx, next) => {
  const query = ctx.query as QueryParams;

  // TODO: 시간 정보에 따라 데이터를 하나만 남길 수 있도록 질의를 수정해야함
  // TODO: 서울 지점도.
  const result = await prisma.losts.findMany({
    // 최대한 중복 데이터 거르기
    distinct: ["name", "province", "category", "when_found", "where_found"],
    where: {
      name: {
        contains: query.name,
      },
      category: {
        equals: query.category,
      },
      state: {
        equals: query.state,
      },
      where_found: {
        equals: query.where_found,
      },
      when_found: {
        gte: query.startDt && new Date(query.startDt),
        lte: query.endDt && new Date(query.endDt),
      },
      province: {
        equals: "서울",
      },
    },
  });

  ctx.body = result;
});

/** 서울 지점 유실물 데이터 갱신 라우터 */
router.post("/seoul", async (ctx, next) => {
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
