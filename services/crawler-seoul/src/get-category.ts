import fetch from "node-fetch";
import { parse } from "node-html-parser";

interface Category {
  /**
   * 카테고리 아이디
   * @description 쿼리 시, 카테고리 아이디를 사용해야 합니다.
   */
  id: string;
  /**
   * 카테고리 이름
   * @description 사용자에게 보여줄 떄, 해당 이름을 사용하여 보여줍니다.
   */
  name: string;
}

/**
 * 부산 롯데월드 유실물 페이지에서 물품 분류 가져오는 함수
 * @returns
 */
const getCategoryList = async () => {
  const response = await fetch(
    "https://adventure.lotteworld.com/kor/communication/lost-property/list.do"
  );

  const text = await response.text();

  const document = parse(text);

  const categoryOptions = document
    .querySelectorAll("div.srchSel > div > a")
    .map((element) => {
      return {
        id: element.getAttribute("data-cd") || "",
        name: element.innerText,
      } satisfies Category;
    })
    // 유효하지 않은 아이디 걸러내기
    // 기본 선택자인 '전체'를 걸러내기 위함
    .filter((item) => item.id);

  return categoryOptions;
};

export { getCategoryList, type Category };
