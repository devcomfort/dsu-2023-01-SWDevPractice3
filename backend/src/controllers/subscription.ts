import bodyParser from "koa-bodyparser";
import Router from "koa-router";
import joi from "joi";
import { PrismaClient } from "@prisma/client";

import { sendNewAuthorizationEmail } from "email-sender";
import { newAuthCode } from "../services/auth-code.js";

interface AddSubscriptionQueryParams {
  /** 구독자 이메일 정보 (알림 및 구분용) */
  email: string;
  name: string;
  category?: string;
  /** 조회 시작 기준일 (YYYY-MM-DD) */
  startDt?: string;
  /** 놀이공원 지점 정보 */
  province: string;
}

interface CancelSubscriptionQueryParams {
  email: string;
}

interface ResponseResult {
  msg: string;
}

interface ResponseError {
  msg: string;
}

const AddSubscriptionSchema = joi.object<AddSubscriptionQueryParams>({
  email: joi.string().email().required().messages({
    "any.required": "이메일 주소가 입력되지 않았습니다",
    "string.email": "이메일 형식이 유효하지 않습니다",
  }),
  name: joi.string().min(1).required().messages({
    "any.required": "아무런 값이 입력되지 않았습니다",
    "string.min": "아무런 값이 입력되지 않았습니다",
  }),
  category: joi.string().allow("").optional(),
  province: joi.string().allow("").optional(),
  startDt: joi.date().optional(),
});

const CancelSubscriptionSchema = joi.object<CancelSubscriptionQueryParams>({
  email: joi.string().email().required().messages({
    "any.required": "이메일 주소가 입력되지 않았습니다",
    "string.email": "이메일 형식이 유효하지 않습니다",
  }),
});

const prisma = new PrismaClient();

const router = new Router();

router.use(bodyParser());

// 구독자 추가 라우터
router.post("/subscription", async (ctx, next) => {
  const query = ctx.request.body as Partial<AddSubscriptionQueryParams>;

  const queryValidation = AddSubscriptionSchema.validate(query);

  // 형태소 검증
  if (queryValidation.error) {
    ctx.status = 400; // Bad Request
    console.log(queryValidation.value);
    ctx.body = JSON.stringify({
      msg: queryValidation.error.message,
    } satisfies ResponseError);
    return;
  }

  // 이미 있는 계정이 아닌지 검증
  const u = await prisma.subscription.findFirst({
    where: {
      email: query.email,
    },
  });

  if (!(u === null)) {
    ctx.status = 400;
    ctx.body = JSON.stringify({
      msg: "이미 존재하는 구독자 입니다",
    } satisfies ResponseError);
    return;
  }

  const code = newAuthCode();

  const _date = new Date();
  _date.setMinutes(_date.getMinutes() + 5);

  try {
    await prisma.$transaction([
      prisma.subscription.create({
        data: {
          email: query.email!,
          name: query.name!,
          startDt: query.startDt,
          category: query.category,
          province: query.province,
        },
      }),
      prisma.authorization_code.create({
        data: {
          code,
          when_expire: _date,
          targetEmail: {
            connect: {
              email: query.email!,
            },
          },
        },
        include: {
          targetEmail: true,
        },
      }),
    ]);

    const _url = ctx.URL;
    _url.pathname = `/auth/${code}`;
    sendNewAuthorizationEmail(_url.toString());

    ctx.status = 200;
    ctx.body = {
      msg: "성공적으로 등록하였습니다. 이메일을 확인해주세요",
    } satisfies ResponseResult;
  } catch (err) {
    console.log(err);
    ctx.status = 503;
    ctx.body = JSON.stringify({
      msg: "일시적으로 서버에서 요청을 처리하지 못 했습니다. 잠시 후 다시 시도해주세요",
    } satisfies ResponseError);
    return;
  }
});

// 구독 정보 수정 라우터
router.put("/subscription", async (ctx, next) => {
  const query = ctx.request.body as Partial<AddSubscriptionQueryParams>;

  const queryValidation = AddSubscriptionSchema.validate(query);

  console.log(query);

  // 형태소 검증
  if (queryValidation.error) {
    ctx.status = 400; // Bad Request
    ctx.body = JSON.stringify({
      msg: queryValidation.error.message,
    } satisfies ResponseError);
    return;
  }

  // 이미 있는 계정이 아닌지 검증
  const u = await prisma.subscription.findFirst({
    where: {
      email: query.email,
    },
  });

  if (u === null) {
    ctx.status = 400;
    ctx.body = JSON.stringify({
      msg: "존재하지 않는 구독자 입니다",
    } satisfies ResponseError);
    return;
  }

  try {
    await prisma.subscription.update({
      where: {
        email: query.email!,
      },
      data: {
        email: query.email!,
        name: query.name!,
        startDt: query.startDt,
        category: query.category,
        province: query.province,
      },
    });
  } catch (err) {
    ctx.status = 503;
    ctx.body = {
      msg: "일시적으로 서버에서 요청을 처리하지 못 했습니다. 잠시 후 다시 시도해주세요",
    } satisfies ResponseError;
  }

  ctx.status = 200;
  ctx.body = {
    msg: "성공적으로 정보를 수정하였습니다",
  };
});

// 구독자 제거 라우터
router.delete("/subscription", async (ctx, next) => {
  const query = ctx.request.body as Partial<CancelSubscriptionQueryParams>;

  const queryValidation = CancelSubscriptionSchema.validate(query);

  if (queryValidation.error) {
    ctx.status = 400;
    ctx.body = JSON.stringify({
      msg: queryValidation.error.message,
    } satisfies ResponseError);
    return;
  }

  const q = await prisma.subscription.findFirst({
    where: {
      email: query.email!,
    },
  });

  if (q === null) {
    ctx.status = 400;
    ctx.body = JSON.stringify({
      msg: "존재하지 않는 구독자 입니다",
    } satisfies ResponseError);
    return;
  }

  try {
    await prisma.$transaction([
      prisma.authorization_code.deleteMany({
        where: {
          targetEmailString: query.email!,
        },
      }),
      prisma.subscription.delete({
        where: {
          email: query.email!,
        },
      }),
    ]);
  } catch (err) {
    console.log(err);
    ctx.status = 503;
    ctx.body = JSON.stringify({
      msg: "일시적으로 서버에서 요청을 처리하지 못 했습니다. 잠시 후 다시 시도해주세요",
    } satisfies ResponseError);
    return;
  }

  ctx.body = {
    msg: "구독자 정보를 성공적으로 제거하였습니다",
  } satisfies ResponseResult;
});

// 인증 이메일 수신 인증 라우터
// - 적졀한 리디렉션 필요
router.get("/auth/:code", async (ctx, next) => {
  const code = ctx.params.code;

  console.log(code);

  // 데이터 유무 검사
  const pastTime = new Date();
  const expireTime = new Date();
  expireTime.setMinutes(expireTime.getMinutes() + 5);
  // 기간 내에 해당 코드를 가진 인증 코드 튜플 색인
  try {
    const q = await prisma.authorization_code.findMany({
      where: {
        code,
        when_expire: {
          gte: pastTime,
          lte: expireTime,
        },
      },
    });

    console.log(q);

    if (q.length <= 0) {
      ctx.status = 400;
      ctx.body = JSON.stringify({
        msg: "유효하지 않은 인증 코드 입니다. 인증 기간이 만료되었을 수 있습니다",
      } satisfies ResponseError);
      return;
    }

    if (q.length === 1) {
      try {
        await prisma.subscription.update({
          data: {
            is_authorized: true,
          },
          where: {
            email: q[0].targetEmailString,
          },
        });
      } catch (err) {
        ctx.status = 503;
        ctx.body = JSON.stringify({
          msg: "일시적으로 서버에서 요청을 처리하지 못 했습니다. 잠시 후 다시 시도해주세요",
        } satisfies ResponseError);
      }
      return;
    }

    if (q.length > 1) {
      ctx.status = 503;
      ctx.body = JSON.stringify({
        msg: "기간 내 중복된 인증 코드가 발견되었습니다. 복권 사러 가십시오",
      } satisfies ResponseError);
      return;
    }
  } catch (err) {
    ctx.status = 503;
    ctx.body = JSON.stringify({
      msg: "일시적으로 서버에서 요청을 처리하지 못 했습니다. 잠시 후 다시 시도해주세요",
    } satisfies ResponseError);
    return;
  }

  // TODO: 적절한 리디렉션 추가하기
});

export default router;
