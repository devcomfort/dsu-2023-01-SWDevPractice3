import fetch from "node-fetch";
import { parse } from "node-html-parser";

/** 복수 페이지 쿼리 파라미터 */
interface QueryParams {
  /** 결과로 원하는 유실물 수 */
  numberOfResult: number;
  /** 검색어 */
  queryKeyword?: string;
  /**
   * 물품 분류 코드
   * @description 귀금속, 가방, 핸드폰 등의 분류코드 (예시: A2001, A2002 등)
   */
  category?: string;
  startDt?: string;
  endDt?: string;
}

/** 단일 페이지 쿼리 파라미터 */
interface SingleQueryParams extends Omit<QueryParams, "numberOfResult"> {
  pageNo: number;
}

/** 결과 내 검색 파라미터 */
interface LocalQueryParams extends Omit<QueryParams, "numberOfResult"> {
  whereFound?: string;
  state?: boolean;
}

/** 유실물 정보 인터페이스 */
interface Lost {
  /** 유실물 이름 */
  name: string;
  /**
   * 유실물 분류 텍스트
   * @description 분류 코드가 아닌 크롤링 결과의 유실물 이름을 그대로 반환합니다.
   * @description 원하는 경우 getCategoryList의 결과를 통해 분류코드로 다시 변환할 수 있습니다.
   */
  category: string | "알 수 없음";
  /**
   * 유실물 발견 시점
   * @description YYYY.MM.DD 포멧의 날짜
   */
  whenFound: string | "알 수 없음";
  /**
   * 유실물 발견 지점
   * @description "스완레이크 비클"과 같이 발견된 놀이기구의 이름을 명시합니다.
   */
  whereFound: string | "알 수 없음";
  /**
   * 현재 유실물의 상태
   * @description "보관중" | "방문수령" | "택배발송"
   * @description 아직 발견되지 않은 텍스트 도메인이 있을 것을 대비하여, string으로 처리함.
   */
  state: string | "알 수 없음";
}

interface QueryResult {
  /** 쿼리한 유실물 결과 */
  losts: Lost[];
  /** 쿼리 결과물 길이 */
  length: number;
}

/** 페이지 당 유실물 정보 (부산은 8, 서울은 10) */
const LOST_PER_PAGE = 8;

// TODO: ENUMS 추출하는 함수 따로 만들 수 있을 듯
const getCategoryEnums = (losts: Lost[]) => {
  return losts.reduce<string[]>((acc, cur) => {
    const { category } = cur;
    return acc.includes(category) ? acc : [...acc, category];
  }, []);
};

const getFoundSpotEnums = (losts: Lost[]) => {
  return losts.reduce<string[]>((acc, cur) => {
    const { whereFound } = cur;
    return acc.includes(whereFound) ? acc : [...acc, whereFound];
  }, []);
};

const singleQuery = async (q: SingleQueryParams): Promise<QueryResult> => {
  const { pageNo, category, endDt, queryKeyword, startDt } = q;

  const url = new URL(
    "https://adventurebusan.lotteworld.com/kor/customer/lost-property/listPart.do"
  );
  const params = new URLSearchParams({
    pageIndex: String(pageNo),
    acqrCategCd: category || "",
    q: queryKeyword || "",
    startDt: startDt || "",
    endDt: endDt || "",
  }).toString();

  url.search = params;

  const response = await fetch(url);

  const text = await response.text();

  const document = parse(text);

  const results: Lost[] = document
    .querySelectorAll("li.prptLi")
    .map((element) => {
      return {
        category: element.querySelector("div.ctrg")?.innerText || "알 수 없음",
        name: element.querySelector("div.title")?.innerText || "",
        state: element.querySelector("div.state")?.innerText || "알 수 없음",
        whenFound: element.querySelector("div.date")?.innerText || "알 수 없음",
        whereFound:
          element.querySelector("div.place > span")?.innerText || "알 수 없음",
      } satisfies Lost;
    });

  return {
    losts: results,
    length: results.length,
  };
};

const query = async (q: QueryParams): Promise<QueryResult> => {
  const { numberOfResult, queryKeyword, category, startDt, endDt } = q;

  /** 시작 페이지 번호 */
  const startPageNo = 1;
  /** 끝 페이지 번호 */
  const endPageNo = Math.ceil(numberOfResult / LOST_PER_PAGE);
  /** 시작 페이지 번호 ~ 끝 페이지 번호까지 1씩 증가하는 배열 형성 */
  const range = new Array(endPageNo - startPageNo + 1)
    .fill(0)
    .map((_, i) => i + 1);

  const results = await Promise.all(
    range.map((pageNo) =>
      singleQuery({
        pageNo,
        queryKeyword,
        category,
        startDt,
        endDt,
      })
    )
  );

  return {
    losts: results.reduce<Lost[]>((acc, cur) => [...acc, ...cur.losts], []),
    length: results.reduce<number>((acc, cur) => acc + cur.length, 0),
  };
};

const queryAll = async (batch: number = 5) => {
  let results: Lost[] = [];

  /** 이전 시도에서 누락된 페이지 인덱스 캐싱 */
  let rejected_pages: number[] = [];
  for (let length = 0; ; ) {
    // 현재 저장된 데이터의 길이 (마지막 인덱스부터 쿼리)
    const range = new Array(batch).fill(0).map((_, i) => length + i + 1);

    console.log(`range 생성됨: ${range.join(", ")}`);
    console.log(`rejected: ${rejected_pages.join(", ")}`);

    // 요청 결과를 성공 여부와 함께 반환
    const responses = await Promise.allSettled(
      (rejected_pages.length > 0 ? rejected_pages : range).map((i) =>
        singleQuery({
          pageNo: i,
        })
      )
    );

    // 성공한 요청만 뽑아서 결과 해석 후 저장
    const _results = responses.reduce<Lost[]>((acc, cur) => {
      if (cur.status === "fulfilled") return [...acc, ...cur.value.losts];
      return acc;
    }, []);

    results = [...results, ..._results];

    // 실패한 요청은 다시 요청하기 위해 저장
    rejected_pages = responses.reduce<number[]>((acc, cur, i) => {
      // NOTE: i가 일반적인 배열의 인덱스, 도메인이 0 ~ batch - 1인 값이기 때문에
      // queryAll 함수 초반에서처럼 length + i + 1 형태로 다시 연산, 병합함
      if (cur.status === "rejected") return [...acc, length + i + 1];
      return acc;
    }, []);

    // 현재 배치가 끝난 이후, 다음 배치로 이동.
    if (rejected_pages.length <= 0) length += batch;

    if (_results.length === 0) break;
  }

  return {
    losts: results,
    length: results.length,
  } as QueryResult;
};

export { getCategoryEnums, getFoundSpotEnums, singleQuery, query, queryAll };
