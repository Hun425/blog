---
title: "4week_spring : 3주차 트러블 슈팅"
description: "카카오 로그인 인가코드 발급후, 토큰 요청시 401 ERROR 발생공식문서를 찾아보니 클라이언트 시크릿을 적용하고, 시크릿 코드를 포함하지 않으면 나는 오류라는 것을 발견 하지만 나는 시크릿 코드를 활성화 하지 않음이전에는 Json 형식으로 데이터를 보내야 했지만, 최"
date: 2024-06-23
category: algorithm
tags: ["Java", "Spring", "project"]
cover: ./cover.png
velogUrl: https://velog.io/@chae0738/4weekspring-3%EC%A3%BC%EC%B0%A8-%ED%8A%B8%EB%9F%AC%EB%B8%94-%EC%8A%88%ED%8C%85
---

## 문제 1
---

### 문제내용

- 카카오 로그인 인가코드 발급후, 토큰 요청시 `401 ERROR` 발생

### 해결방안 도출

- 공식문서를 찾아보니 클라이언트 시크릿을 적용하고, **시크릿 코드**를 포함하지 않으면 나는 오류라는 것을 발견 `하지만 나는 시크릿 코드를 활성화 하지 않음`
- 이전에는 `Json` 형식으로 데이터를 보내야 했지만, 최근들어 `QueryString`으로 보내야 한다는걸 알게됨

### 결과 
``` java
2024-06-22T23:54:14.499+09:00  INFO 18804 --- [board] [nio-8080-exec-3] c.f.s.controller.KaKaoLoginController    : 토큰에 대한 정보입니다.KakaoTokenResponse(access_token=WxqXe18hKmTjZFTC24L3hQt0l-4BhdXxAAAAAQoqJY8AAAGQQHDU0G1lzvpaqIEo, token_type=bearer, refresh_token=MRBx2rLZ2Iy9KspTO9ZvfKvd4YvW835iAAAAAgoqJY8AAAGQQHDUzm1lzvpaqIEo, expires_in=21599, scope=openid profile_nickname, refresh_token_expires_in=5183999)

```
- 토큰 발급 성공

### 추가 학습내용
- `WebClient` 기본 사용법을 학습했다.
- Mono `QueryString` 방법과 Flux `Json` 방법을 자세히 알게되었다!

<br><br><br>
