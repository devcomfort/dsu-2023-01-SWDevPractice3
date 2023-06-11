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
const LOST_PER_PAGE = 10;

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
    "https://adventure.lotteworld.com/kor/communication/lost-property/list.do"
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
    .querySelectorAll(
      "#cBody > div > div.container > div > div.listType1 > ul > li"
    )
    .map((element) => {
      return {
        category: element.querySelector("p.sort")?.innerText || "알 수 없음",
        name: element.querySelector("p.find")?.innerText || "",
        state: element.querySelector("p.result")?.innerText || "알 수 없음",
        whenFound: element.querySelector("p.date2")?.innerText || "알 수 없음",
        whereFound: element.querySelector("p.place")?.innerText || "알 수 없음",
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

// TODO: queryAll 함수 추가
// 정해진 배치를 기준으로 배치만큼의 페이지를 더 이상 결과가 나오지 않을 때까지 자동으로 조회하는 함수

export { getCategoryEnums, getFoundSpotEnums, singleQuery, query };
