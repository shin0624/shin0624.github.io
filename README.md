# fastapi_mysite_card
fastapi, jinja2, sqlalchemy, mariadb, docker, docker-compose, aws, langchain, apischeduler, uvicorn, requests
postman : api테스트
pip install-r requirements.txt ==> requirement.txt에 있는 파일 모두 다운
pip freeze > requirements.txt ==>개발에 썼던 프로그램 모두 다운

### 라이브러리 설명
1. fastpai : 웹 프레임워크 + API
2. uvicorn : WAS(웹 어플리케이션 서버)
3. jinja2 : 템플릿 엔진(HTML, CSS, JS)


### Web 프로그래밍 기초 설명
1. URL
    - http://127.0.0.1:8000 = http://localhost:8000
    - 127.0.0.1과 localhost는 루프백 주소(현재 디바이스의 IP를 의미)
    - 실제 서비스를 위해서는 127.0.0.1 부분을 고정ip로 변경(구매)-->DNS구매 --> 연결
    - http = 프로토콜
    - 8000 = Port번호
    - http에서 제공하는 함수(get, post, put, delete)
    - http://127.0.0.1:8000/member?id=abc&name=cherry -->member라는 키워드로부터 ?이후의 값을 전달하는 "쿼리스트링(url로 값을 전달하는 get방식)"
    -쿼리스트링 단점 : url에 정보가 노출됨-->숨겨야 하는 정보들은 "post방식"으로 전송

2. DAO and DTO
    - DAO (Data Access Object): CRUD 할 때 사용
        + Create : INSERT
        + Read : SELECET
        + Update : UPDATE
        + Delete : DELETE

    - DTO (Data Transfer Object) :

3. 유효성(Validation) 체크
    - 유효성 체크는 사용자의 값이 올바른 값인지 체크하는 것
        + 예 : 이메일(이메일 형식인지?)
    - 역사
        1. 유효성 체크 : 초기에는 서버에서 수행했음 --> 과부하 발생
        2.                        클라이언트(웹브라우저)--> JS (현재까지 사용중)
        3.                        서버 추가 --> 더블 체크(pydantic)





### 카카오톡 나에게 톡보내기
 - 인증코드->"https://kauth.kakao.com/oauth/token"
 - 127.0.0.1:8000 / 

  - https://kauth.kakao.com/oauth/authorize?client_id=6efd8b4fcb383addb3586c8fa6f477a3&redirect_uri=http://127.0.0.1:8000&response_type=code&scope=talk_message

  - 오류 시 : https://developers.kakao.com/docs/latest/ko/message/rest-api#default-template-msg-me

 ### 1. 카카오 API 용어
  - 인증 코드 : 1회성, 토큰(Access, Refresh)을 발급받기  위해 사용
  - Access 토큰 :  카카오  api서비스를 이용할 때 사용
  - Refresh 토큰 : Access토큰을 재발급 받기 위해 사용
  - 생명 주기 : 인증코드(1회), Access(6시간), Refresh(2달)
  - Refresh토큰은 발급 후 1달 후부터 재발급 가능
  - Access와 Refresh 재발급 받는 코드는 동일
  - 재발급 코드 : Refresh 발급 후 1달 미만-> Access토큰만 재발급해서 리턴
  - 재발급 코드 : Refresh 발급 후 1달 이상-> Access 토큰과 Refresh 토큰 재발급 해서 리턴

  ### 2. 카카오 API 사용 방법
  1. KAKAO Developer 사이트에서 "권한 허용 및 동의"
  2. 웹 브라우저 URL을 통해서 인증 코드 발급
  3. 인증코드 사용해서 토큰(Access, Refresh) 발급
  4. Access 사용해서 서비스 이용
  5. + 1달에 한번씩 Refresh토큰 재발급 스케줄링
