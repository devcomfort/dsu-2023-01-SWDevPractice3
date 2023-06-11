# 소프트웨어개발실습3 Java 앱 개발 실습

소프트웨어개발실습3 과목에서 3인 1조로 앱 개발 실습을 진행한 결과물 레포지토리입니다.

시간 부족으로 프로덕션을 위한 다음 기능이 누락되었습니다:

- 데이터베이스 내역을 비교하여 변경된 부분까지만 크롤링하는 기능
- 전체 유실물 페이지를 크롤링하는 기능
- 카카오톡 및 문자 알림 기능
- 크론잡 구성을 통한 크롤링, 알림 자동화
- 웹사이트 뉴스레터 신청
- 로거 추가
- 그 외 데이터베이스 테이블 및 기능이 누락되었습니다.
  - 참조: https://dbdocs.io/kimdonghyun026/SoftwareDEVExperiment3-ERD?table=subscribers&schema=public&view=table_structure

따라서 다음의 최소 기능만 구현되었습니다:

- 서버: 이메일을 통한 알림 기능
- 서버: 웹훅을 통한 알림 큐 실행
- ~~서버: 시연을 위한 토큰 기반 로그인 기능~~
- 앱: 분실물 조회 기능
- 앱: 분실물 알림 신청 기능
- 앱: 푸시 알림 기능
