---
title: "RESTful API 마스터하기"
description: "당신은 REST API를 완벽하게 알고있습니까?"
date: 2025-04-18
category: cs
tags: ["REST API"]
cover: ./cover.jpg
velogUrl: https://velog.io/@chae0738/REST-API-%EB%A7%88%EC%8A%A4%ED%84%B0%ED%95%98%EA%B8%B0
---

## 최근 근황
길고 길었던 고민이 대부분 정리되면서 점점 멘탈은 회복되었지만... 
2주째 8~9시 퇴근하는 상황에는 여전히 적응을 못하고있다.
이번주는 사이드 프로젝트의 오류사항을 수정하는데 대부분 전념하느라 블로그 글을 정리 할 시간이 없었지만, 내일과 내일모래도 출근해야되기에 잠을 줄여서라도 그동안 공부한 내용을 글로 정리해보기로 했다.

## 갑자기 왜 RESTful API?

> REST API가 무엇인지 설명해보세요.

최근 본 면접에서도 나온 질문이였고, 작년 삼성 면접에서도 나왔던 질문 중에 하나였다. 
`그만큼 기본이라 다들 알텐데 왜..?`

나는 사실 이 질문을 작년에 처음 들었을 때, 충분히 답변할 수 있다고 생각했다.

>행위는 메서드로... 자원을 표시하는 프로토콜 규약이고... 무상태성이 특징이고...

이때는 이런 답변으로도 충분하다고 생각했지만... 지금와서 다시 생각해보니, 여기서 한단계씩만 질문을 더 깊게 들어가도 갑자기 헷갈리는 내용들이 많아졌다.

>거기서 말하는 자원이 정확히 뭐죠?
>그럼 URL과 URI의 차이점이 뭔가요?
>RESTFUL에서 본인이 가장 중요하다고 생각하는 원칙은?
>...

기본이라 생각했던만큼, 너무 당연하게 생각하고 넘겼던 개념인 것 같아 이번기회를 통해 완벽하게 마스터 해보자고 생각해서 공부를 시작해보게 되었다!

## 1. URI와 URL, 무엇이 다르고 어떻게 연관될까?

처음에는 URI와 URL이 비슷해 보여 혼동스러웠다. 학습을 통해 두 개념의 정의와 관계를 명확히 할 수 있었다.

### 개념적 차이와 관계

- **URI (Uniform Resource Identifier, 통합 자원 식별자):** 인터넷상의 자원(웹 페이지, 이미지, 파일 등)을 **고유하게 식별**하기 위한 문자열 규약을 의미했다. 자원의 '이름'이나 '주소' 역할을 하는, 가장 포괄적인 개념이었다.
    
- **URL (Uniform Resource Locator, 통합 자원 위치 지정자):** 특정 자원이 네트워크 상의 **어디에 있는지(위치)**와 **어떻게 접근해야 하는지(프로토콜)**를 명시하는 문자열이었다. 우리가 흔히 웹 브라우저 주소창에 입력하는 주소가 바로 URL이며, 이는 URI의 한 종류였다.
    
- **URN (Uniform Resource Name):** URI의 또 다른 형태로, 자원의 위치에 상관없이 **영구적이고 유일한 이름**을 제공했다. 예를 들어, ISBN(국제 표준 도서 번호)은 URN 형태로 표현될 수 있었다.
    
- **핵심 관계:** URI는 자원을 식별하는 큰 개념이며, URL과 URN은 그 하위 개념이었다. URL은 '위치'를 통해, URN은 '이름'을 통해 자원을 식별했다. 따라서 **모든 URL은 URI이지만, 모든 URI가 URL인 것은 아니었다.**
    

### URI, URL, URN의 구조와 예시

- **URL 구조:** `스키마(프로토콜)://호스트[:포트][/경로][?쿼리][#프래그먼트]`
    
    - 스키마/프로토콜: http, https, ftp 등
    - 호스트: 도메인 이름(www.example.com) 또는 IP 주소
    - 포트: 서비스 접근 포트 (기본값은 생략 가능, HTTP는 80, HTTPS는 443)
    - 경로: 자원의 경로 (/users/profile)
    - 쿼리: 추가 매개변수 (?id=123&page=2)
    - 프래그먼트: 문서 내 특정 부분 지정 (#section1)
- **예시:**
    
    - URL: `https://www.example.com:443/users/profile?id=123#section1`
    - URN: `urn:isbn:978-89-6077-733-0`, `urn:uuid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6`
    - URI (URL과 URN 모두 포함): 위의 모든 예시

### 실제 개발에서의 의미

웹 개발, 특히 RESTful API 설계에서는 URL을 통해 자원(리소스)을 식별하고 접근했다. 이때 URL은 URI의 일종으로서 자원을 고유하게 식별하는 역할을 했다. API 엔드포인트 설계 시 `/users/123`과 같은 경로는 자원을 식별하는 URI이자 URL 경로였다.

## 2. RESTful API 설계의 6가지 핵심 원칙

REST(Representational State Transfer)는 웹과 같은 분산 하이퍼미디어 시스템을 위한 아키텍처 스타일이었다. Roy Fielding이 2000년 박사 논문에서 처음 소개한 이 개념은 웹의 기존 아키텍처를 설명하고 확장하기 위해 제안되었다. 좋은 RESTful API를 설계하기 위해 따라야 할 6가지 주요 원칙(제약 조건)이 있었다.

### 1) 자원 기반 구조 (Resource-Based) / URI를 통한 자원 식별

- API에서 다루는 모든 것을 **자원(Resource)**으로 정의하고, 각 자원은 **고유한 URI를 통해 식별**되어야 했다. API의 중심은 기능이 아닌 자원이었다.
    
- 실제 웹 API 구현에서는 이 **URI가 주로 URL 형태**로 나타났다. 예를 들어, `/users/123`은 'ID가 123인 사용자'라는 자원을 식별하는 URI(이자 URL 경로)였다. 여기서 중요한 점은 `/users/123` 전체가 자원을 식별하는 URI이지, `123`만 식별자가 아니라는 것이었다.
    

#### 자원 설계 시 고려사항

- **명사 사용:** 자원은 명사(복수형 권장)로 표현한다. `/users`, `/products`, `/categories` 등
- **계층 구조 활용:** 자원 간 관계를 계층으로 표현한다. `/users/123/orders`
- **일관성 유지:** 모든 API 엔드포인트에서 일관된 명명 규칙 사용 (스네이크 케이스 또는 카멜 케이스)
- **버전 관리:** API 버전을 URI에 포함시키는 방법 (`/v1/users`)과 헤더에 포함시키는 방법(`Accept: application/vnd.example.v1+json`) 중 선택

#### 잘못된 설계 예시

- `/getUsers`: 행위(get)를 URI에 포함
- `/user/create`: 행위(create)를 URI에 포함
- `/api/123`: 자원의 유형을 식별할 수 없음

#### 올바른 설계 예시

- `GET /users`: 모든 사용자 목록 조회
- `POST /users`: 새 사용자 생성
- `GET /users/123`: 특정 사용자 조회

### 2) HTTP 메서드를 통한 행위 표현

- 자원에 대한 행위(조회, 생성, 수정, 삭제 등)는 **표준 HTTP 메서드(GET, POST, PUT, DELETE, PATCH 등)**를 통해 명시적으로 표현해야 했다. URI에는 행위를 포함하지 않았다.

#### 주요 HTTP 메서드와 용도

- **GET:** 자원 조회 (Read)
    
    - `GET /users/123`: 사용자 조회
    - 안전(Safe)하며 멱등성(Idempotent)을 가짐 - 여러 번 호출해도 결과가 동일
    - 요청 본문(body)에 데이터를 포함하지 않음
    - 캐시 가능
- **POST:** 자원 생성 (Create)
    
    - `POST /users`: 새 사용자 생성
    - 안전하지 않으며, 멱등성이 없음 - 여러 번 호출하면 여러 자원이 생성될 수 있음
    - 요청 본문에 생성할 자원의 데이터를 포함
    - 일반적으로 캐시되지 않음
- **PUT:** 자원 완전 대체 (Update - 전체)
    
    - `PUT /users/123`: 사용자 정보 전체 수정
    - 안전하지 않지만, 멱등성을 가짐 - 여러 번 호출해도 결과가 동일
    - 요청 본문에 대체할 자원의 전체 데이터를 포함
    - 일반적으로 캐시되지 않음
- **DELETE:** 자원 삭제 (Delete)
    
    - `DELETE /users/123`: 사용자 삭제
    - 안전하지 않지만, 멱등성을 가짐 - 첫 번째 호출 후 자원이 없어도 결과는 동일
    - 요청 본문이 일반적으로 필요 없음
    - 캐시되지 않음
- **PATCH:** 자원 부분 수정 (Update - 부분)
    
    - `PATCH /users/123`: 사용자 정보 일부 수정
    - 안전하지 않으며, 구현에 따라 멱등성이 결정됨
    - 요청 본문에 변경할 필드만 포함
    - 일반적으로 캐시되지 않음
- **기타 메서드:** HEAD, OPTIONS 등
    

#### HTTP 메서드 설계 모범 사례

- **적절한 상태 코드 사용:**
    
    - 2xx: 성공 (200 OK, 201 Created, 204 No Content)
    - 4xx: 클라이언트 오류 (400 Bad Request, 401 Unauthorized, 404 Not Found)
    - 5xx: 서버 오류 (500 Internal Server Error)
- **일관된 응답 구조 유지:**
    
    - 성공 시: 자원 표현이나 상태 정보 반환
    - 실패 시: 오류 코드와 메시지 포함
- **멱등성 존중:** GET, PUT, DELETE는 멱등성을 유지하도록 구현
    

### 3) 무상태성 (Stateless)

- 서버는 클라이언트의 상태를 저장하지 않아야 했다. 각 요청은 **그 자체로 완전해야 하며**, 서버가 요청을 처리하는 데 필요한 모든 정보를 포함해야 했다. 상태 정보(예: 인증 토큰)는 클라이언트가 매 요청 시 함께 전달해야 했다. 이는 서버의 확장성과 신뢰성을 높이는 중요한 요소였다.

#### 무상태성의 장점

- **확장성 향상:** 서버 간 상태 공유가 필요 없어 수평적 확장이 용이함
- **신뢰성 증가:** 부분 실패에 대한 영향이 제한적임
- **단순성:** 서버 구현이 단순해짐
- **가시성 개선:** 요청만으로 의도를 완전히 이해할 수 있음

#### 무상태성 구현 방법

- **인증 토큰 사용:** JWT(JSON Web Token)와 같은 자체 포함된(self-contained) 토큰 활용
- **요청 매개변수:** 필요한 모든 데이터를 쿼리 파라미터, 헤더, 또는 요청 본문에 포함
- **세션 관리 회피:** 서버 측 세션 상태 저장 지양

### 4) 캐시 가능성 (Cacheable)

- 클라이언트는 서버 응답을 캐시할 수 있어야 했다. 서버는 응답 데이터가 캐시 가능한지 여부를 HTTP 헤더(`Cache-Control` 등)를 통해 명시해야 했다. 캐싱은 성능을 향상시키고 서버 부하를 줄이는 데 도움을 주었다.

#### 캐싱 관련 HTTP 헤더

- **Cache-Control:** 캐싱 정책 지정
    
    - `private`: 브라우저만 캐싱 가능
    - `public`: 중간 프록시도 캐싱 가능
    - `max-age=3600`: 캐시 유효 시간(초)
    - `no-cache`: 재검증 필요
    - `no-store`: 캐싱 금지
- **ETag:** 자원의 특정 버전을 식별하는 고유 태그
    
- **Last-Modified:** 자원이 마지막으로 수정된 시간
    
- **If-None-Match, If-Modified-Since:** 조건부 요청을 위한 헤더
    

#### 효과적인 캐싱 전략

- **GET 요청 위주 캐싱:** 안전하고 멱등성이 있는 GET 요청을 주로 캐싱
- **자원별 캐시 정책:** 자원의 변경 빈도에 따라 다른 캐싱 정책 적용
- **버전 관리 활용:** 자원 변경 시 URL 변경(예: 해시 추가)으로 캐싱 우회

### 5) 계층화된 시스템 (Layered System)

- 클라이언트는 API 서버와 직접 통신하는지, 중간에 로드 밸런서나 프록시 같은 계층을 거치는지 알 필요가 없어야 했다. 각 계층은 특정 역할을 수행하며, 전체 시스템 구조의 유연성과 확장성을 높여주었다.

#### 계층화의 이점

- **관심사 분리:** 각 계층이 특정 기능에 집중 (보안, 로드 밸런싱, 캐싱 등)
- **확장성:** 필요에 따라 특정 계층만 확장 가능
- **보안 강화:** 다중 방어 계층 구성 가능
- **독립적 진화:** 각 계층이 독립적으로 개선될 수 있음

#### 일반적인 계층 구성

- **클라이언트 계층:** 사용자 인터페이스, 모바일 앱, 웹 브라우저
- **전달 계층:** CDN, API 게이트웨이, 로드 밸런서
- **응용 계층:** API 서버, 비즈니스 로직
- **데이터 계층:** 데이터베이스, 캐시 서버

#### 계층화 구현 시 고려사항

- **투명성 유지:** 클라이언트는 시스템 내부 구조를 알 필요가 없음
- **성능 최적화:** 계층 추가에 따른 지연 시간 최소화
- **보안 경계 설정:** 각 계층 간 적절한 보안 통제 구현

### 6) 통일된 인터페이스 (Uniform Interface)

- 시스템 구성 요소 간의 상호작용 방식을 일관되게 제한하는 핵심 원칙이었다. 여기에는 다음 네 가지 세부 제약 조건이 포함되었다.

#### 1. 자원의 식별 (Resource Identification)

- 위에서 설명한 1번 원칙과 동일하게, 모든 자원은 URI로 식별되어야 함

#### 2. 표현을 통한 자원 조작 (Manipulation of Resources Through Representations)

- 클라이언트는 자원의 표현(JSON, XML 등)을 받아 이를 변경한 후 서버에 전송하여 자원 상태를 변경
- 동일한 URI로 다양한 형식의 표현을 요청 가능 (Accept 헤더 활용)
- 자원과 표현은 분리된 개념:
    - 자원: 추상적 개념 (예: 특정 사용자)
    - 표현: 구체적 형태 (예: 해당 사용자의 JSON 데이터)

#### 3. 자기 서술적 메시지 (Self-Descriptive Messages)

- 각 메시지는 자신을 처리하는 방법을 설명하는 정보를 포함해야 함
    
- 표준 HTTP 헤더 활용:
    
    - `Content-Type`: 메시지 본문의 미디어 타입 (application/json 등)
    - `Content-Length`: 본문 크기
    - `Host`: 요청 대상 서버
    - `Accept`: 클라이언트가 처리할 수 있는 미디어 타입
- 메시지만으로 의도와 처리 방법을 이해할 수 있어야 함
    

#### 4. HATEOAS (Hypermedia as the Engine of Application State)

- 응답에 다음 상태로 전이할 수 있는 관련 리소스 링크를 포함시켜, 클라이언트가 동적으로 API를 탐색할 수 있게 해야 했다.
- API를 통해 상태 기계처럼 애플리케이션 상태 전이를 유도
- 클라이언트는 처음에 진입점 URI만 알고 있어도 하이퍼링크를 통해 전체 API 탐색 가능
- 서버가 제공하는 링크를 따라 클라이언트 애플리케이션이 상태 전이

##### HATEOAS 예시 (JSON 형식):

```json
{
  "id": 123,
  "name": "홍길동",
  "email": "hong@example.com",
  "_links": {
    "self": {
      "href": "/users/123"
    },
    "orders": {
      "href": "/users/123/orders"
    },
    "update": {
      "href": "/users/123",
      "method": "PUT"
    },
    "delete": {
      "href": "/users/123",
      "method": "DELETE"
    }
  }
}
```

이 응답은 현재 사용자 정보와 함께, 이 자원에 대해 수행할 수 있는 작업(조회, 주문 목록 보기, 수정, 삭제)의 링크를 함께 제공했다.

## 3. RESTful API 설계 모범 사례와 실제 적용

위의 6가지 원칙 외에도, 실무에서 RESTful API를 설계할 때 고려해야 할 몇 가지 추가적인 모범 사례가 있었다.

### 일관된 명명 규칙

- **URL 경로:** 소문자 사용, 단어 구분은 하이픈(-) 또는 밑줄(_) 사용 (예: `/user-profiles` 또는 `/user_profiles`)
- **쿼리 파라미터:** camelCase 권장 (예: `?sortBy=createdAt&orderBy=desc`)
- **응답 필드:** 일관된 명명 규칙 사용 (JSON의 경우 camelCase 또는 snake_case 중 하나로 통일)

### 페이지네이션, 필터링, 정렬 표준화

- **페이지네이션:** `?page=2&size=10` 또는 `?offset=20&limit=10`
- **필터링:** `?status=active&category=tech`
- **정렬:** `?sort=name&order=asc`

### 버전 관리

- **URI 버전 관리:** `/v1/users`, `/v2/users`
- **헤더 버전 관리:** `Accept: application/vnd.example.v2+json`
- **매개변수 버전 관리:** `?version=2.0`

### 오류 처리 일관성

- 표준 HTTP 상태 코드 사용
- 일관된 오류 응답 형식:

```json
{
  "status": 400,
  "code": "INVALID_PARAMETER",
  "message": "유효하지 않은 매개변수입니다.",
  "details": [
    {
      "field": "email",
      "message": "이메일 형식이 올바르지 않습니다."
    }
  ]
}
```

### 보안 관련 고려사항

- **인증 및 권한 부여:** OAuth 2.0, JWT 등 표준 프로토콜 활용
- **HTTPS 사용:** 모든 API 통신은 HTTPS를 통해 암호화
- **API 키 관리:** 클라이언트 식별 및 요청 제한을 위한 API 키 사용
- **CORS 설정:** 웹 브라우저 기반 클라이언트 지원을 위한 적절한 CORS 설정

### API 문서화

- OpenAPI Specification(Swagger)을 활용한 문서화
- 각 엔드포인트의 목적, 요청/응답 형식, 예제, 오류 시나리오 포함
- 실제 API와 동기화된 문서 유지

## 4. RESTful API의 실제 구현에서의 타협점

실무에서는 모든 REST 원칙을 완벽하게 준수하기 어려운 경우가 많았다. 특히 다음과 같은 부분에서 타협이 필요했다.

### Richardson 성숙도 모델

Leonard Richardson이 제안한 REST API의 성숙도 모델은 다음 4단계로 구성되었다:

- **레벨 0:** HTTP를 단순한 전송 매커니즘으로만 사용 (RPC 스타일)
- **레벨 1:** 자원 개념 도입 (URI로 자원 식별)
- **레벨 2:** HTTP 메서드 의미적 사용 (GET, POST, PUT, DELETE)
- **레벨 3:** HATEOAS 구현 (하이퍼미디어 제어)

실무에서는 레벨 2까지만 구현하는 경우가 많았다. HATEOAS는 구현 복잡성과 클라이언트 지원 부족으로 완전히 적용하기 어려웠다.

### 실용적 REST

- **완전한 무상태성의 한계:** 인증, 인가 등에서 일부 서버 상태 저장이 필요한 경우
- **캐싱의 선택적 적용:** 모든 자원이 캐싱에 적합하지는 않음
- **HATEOAS의 부분 적용:** 핵심 자원에만 선택적으로 하이퍼링크 제공
- **비-CRUD 작업 처리:** 자원 기반 모델에 맞지 않는 작업을 위한 예외 허용 (예: `/users/123/reset-password`)

## 5. REST 이외의 API 설계 스타일

RESTful API가 널리 사용되고 있지만, 특정 사용 사례에 더 적합한 다른 API 설계 스타일도 있었다.

### GraphQL

- 클라이언트가 필요한 데이터를 정확히 명시할 수 있는 쿼리 언어
- 하나의 요청으로 여러 자원의 데이터를 가져올 수 있음
- 오버페칭, 언더페칭 문제 해결

```graphql
query {
  user(id: "123") {
    name
    email
    orders {
      id
      status
      items {
        productName
        quantity
      }
    }
  }
}
```

### gRPC

- Google에서 개발한 고성능 RPC 프레임워크
- Protocol Buffers를 사용한 효율적인 데이터 직렬화
- 양방향 스트리밍 지원
- 마이크로서비스 간 통신에 적합

### WebSockets

- 양방향 실시간 통신을 위한 프로토콜
- 채팅, 알림, 실시간 대시보드 등에 적합
- REST와 함께 사용되는 경우가 많음

## 결론

이번 공부를 통해 URI와 URL의 개념적 차이를 이해하고, RESTful API 설계 원칙들이 왜 중요한지 알게 되었다. 특히, API 엔드포인트로 사용하는 URL이 자원을 식별하는 URI 역할을 한다는 점, 그리고 각 원칙이 어떻게 상호작용하여 유연하고 확장 가능하며 이해하기 쉬운 API를 만드는 데 기여하는지를 알게되었다는게 너무 좋았다.

실무에서는 상황에 맞게 REST 원칙을 적절히 적용하고 때로는 타협점을 찾는 것이 필요할 것이다. 적절한 설계 결정이란 API의 목적, 대상 사용자, 성능 요구사항 등 다양한 요소에 따라 달라져야하는 것이기 때문이다. `전자정부는 왜 아직도 .do를 쓰는가...`

앞으로 API를 사용하거나 설계할 때 이 원칙들을 염두에 두어야겠다고 생각했다. 또한, GraphQL이나 gRPC와 같은 대안적 접근 방식도 상황에 따라 고려해볼 만했다. 무엇보다 중요한 것은 일관성, 명확성, 사용 편의성을 갖춘 API를 제공하는 것이라는 점을 깨닫게되었다.


## 참고자료
### URI와 URL

- **RFC 3986 - Uniform Resource Identifier (URI): Generic Syntax:** [URI의 표준 문서](https://datatracker.ietf.org/doc/html/rfc3986)
- **What's the difference between a URI, a URL and a URN? - Stack Overflow:** [개발자들이 흔히 겪는 혼란에 대한 명쾌한 답변](https://www.google.com/search?q=https://stackoverflow.com/questions/97083/what-is-the-difference-between-a-uri-a-url-and-a-urn)

### RESTful API 설계 원칙

- **Architectural Styles and the Design of Network-based Software Architectures (Roy Fielding's Dissertation)** : [ REST의 창시자인 Roy Fielding의 박사 논문 원본](https://www.ics.uci.edu/~fielding/pubs/dissertation/top.htm) (특히 Chapter 5를 참조)
- **REST API Design - Google Cloud:** [Google Cloud에서 제공하는 REST API 설계 가이드라인](https://cloud.google.com/apis/design)
- **Best Practices for REST API Design - Atlassian:** [Atlassian에서 제시하는 REST API 설계 모범 사례](https://www.google.com/search?q=https://developer.atlassian.com/server/framework/atlassian-sdk/rest-api-design-guidelines-2/)
