import svelte from "rollup-plugin-svelte";

export default {
  input: "src/email.js", // 이메일 템플릿을 렌더링하는 코드
  output: {
    file: "distundle.js", // 번들 결과 파일
    format: "cjs", // CommonJS로 출력포맷 설정
  },
  plugins: [
    svelte({
      compilerOptions: { customElement: true },
    }),
  ],
  external: ["s-email"], // svelte-email을 외부 모듈로 표시
};
