// 새로운 인증 코드를 생성하는 코드
import { v4 as uuid4 } from "uuid";

const newAuthCode = () => uuid4();

export { newAuthCode };
