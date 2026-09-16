---
title: "세션 관리 전략: 세션 vs JWT"
description: "대기업들은 세션과 JWT를 어떻게 활용하고 있을까?"
date: 2025-03-02
category: backend
tags: ["JWT", "session"]
cover: ./cover.jpg
velogUrl: https://velog.io/@chae0738/%EB%8C%80%EA%B8%B0%EC%97%85%EC%9D%98-%EC%84%B8%EC%85%98-%EA%B4%80%EB%A6%AC-%EC%A0%84%EB%9E%B5-%EC%84%B8%EC%85%98-vs-JWT
---

최근 진행중인 프로젝트에서 인증 및 세션 관리에 대해 논의하면서 한가지 의문이 생겼다. 
`대규모 서비스를 운영하는 기업들은 어떤 방식으로 수백만, 수십억 사용자의 세션을 관리할까?`
특히 JWT(JSON Web Token)가 인기를 얻으면서, Amazon, Facebook, Netflix와 같은 대기업들도 이 방식을 채택하고 있을 것이라 생각했다. 그러나 놀랍게도 현실은 훨씬 더 복잡했다.

이 글에서는 대규모 서비스에서의 세션 관리 방법, 다양한 접근 방식의 장단점, 그리고 실제 기업들이 어떻게 이러한 도전 과제를 해결하고 있는지 조사하고 공부한 내용을 공유하고자 한다.

## 1. 세션 관리의 두 가지 주요 접근법

먼저 사용자 인증과 세션 관리에는 크게 두 가지 접근법이 있다.

### 전통적인 서버 측 세션

이 방식에서는 세션 정보가 서버에 저장되고, 클라이언트(브라우저)에는 **세션을 식별하는 ID**만 쿠키로 전달된다.

**작동 방식:**
1. 사용자 로그인 시 서버에서 세션 생성
2. 세션 ID를 쿠키에 저장하여 클라이언트에 전송
3. 이후 요청에서 클라이언트는 쿠키를 통해 세션 ID 전송
4. 서버는 ID를 통해 세션 정보를 조회

**장점:**
- **민감한 정보**가 서버에 머무름
- 세션을 **즉시 무효화** 가능
- 세션 데이터를 **동적으로 업데이트** 가능
- 네트워크 **트래픽 최소화** (세션 ID만 주고받음)

**단점:**
- 서버 **메모리** 사용량 증가
- **수평적 확장** 시 **세션 공유** 문제
- **상태 유지 필요**(stateful)로 인한 복잡성

### JWT(JSON Web Token)

JWT는 필요한 모든 정보를 자체적으로 포함하는 토큰 기반 인증 방식이다.

**작동 방식:**
1. 사용자 로그인 시 서버에서 JWT 생성
2. 토큰에 필요한 정보(사용자 ID, 권한 등)를 인코딩하고 서명
3. 클라이언트에 토큰 전달 (쿠키, 로컬 스토리지, 기타 방식으로)
4. 이후 요청에서 클라이언트는 토큰을 함께 전송
5. 서버는 토큰의 서명을 검증하고 포함된 정보 사용

**장점:**
- 서버에 **상태 저장 불필요**(stateless)
- **수평적 확장 용이**
- 마이크로서비스 환경에 적합
- **교차 도메인 인증 가능**

**단점:**
- 토큰 폐기가 어려움 (한번 발급된 토큰은 만료 전까지 유효)
- 토큰 크기가 클 수 있음 (네트워크 오버헤드)
- 민감한 정보 노출 위험
- 토큰 탈취 시 보안 위험

## 2. 대기업들의 세션 관리 사례

놀랍게도, 많은 대기업들은 순수한 JWT 방식보다 더 복잡한 **하이브리드 접근법**이나 특화된 세션 관리 시스템을 사용하고 있었다.

### Amazon의 DynamoDB 세션 관리

**Amazon**은 자체 전자상거래 플랫폼에서 **DynamoDB**를 활용한 세션 관리 시스템을 구축했다.

**주요 특징:**
- **세션 ID를 파티션 키**로 사용하여 효율적인 검색
- TTL(Time-To-Live) 기능으로 만료된 세션 자동 삭제
- **글로벌 테이블 기능**으로 전 세계적 세션 동기화
- AWS SDK for PHP와의 원활한 통합
- Lambda와 API Gateway를 활용한 서버리스 세션 관리 지원

**선택 이유:**
- 급격한 트래픽 증가(예: 블랙 프라이데이)에 대응 가능
- 세션 데이터(장바구니, 사용자 기본 설정 등)의 즉각적인 업데이트 필요
- 세션 즉시 만료 기능 필요

### Facebook의 세션 관리 방식

Facebook은 복잡한 사용자 인증 및 세션 관리 시스템을 사용하여 수십억 명의 사용자를 안전하고 효율적으로 처리한다.

**주요 특징:**
- 다층적 세션 관리 접근 방식 사용
- 토큰 기반 인증 시스템 구현
- 세션 쿠키를 통한 사용자 상태 유지
- 정기적인 세션 갱신 메커니즘
- 지리적으로 분산된 인증 서버로 지연 시간 최소화

**세션 관리 프로세스:**
- 사용자 로그인 시 고유한 세션 ID 생성
- 세션 데이터를 서버에 저장 (메모리, 데이터베이스 또는 캐싱 레이어)
- 세션 ID를 쿠키로 사용자 브라우저에 전송
- 각 요청마다 세션 ID 유효성 검사
- 일정 기간 비활성 상태 후 세션 자동 종료

**선택 이유:**
- 대규모 사용자 기반 처리 필요성
- 보안 강화 및 사용자 데이터 보호
- 원활한 사용자 경험 제공
- 다양한 기기 및 플랫폼 지원

### Netflix의 Spring Session + Redis 조합

Netflix는 마이크로서비스 환경에서 Spring Session과 Redis를 결합한 솔루션을 사용한다.

**주요 특징:**
- Spring 프레임워크와의 원활한 통합
- Redis 클러스터로 수평적 확장성 확보
- 마스터-슬레이브 구성으로 고가용성 보장
- 인메모리 특성으로 낮은 지연 시간

**선택 이유:**
- 여러 마이크로서비스 간 세션 공유 필요
- Spring 기반 생태계와의 호환성
- 개발자 친화적인 표준화된 접근법

## 3. JWT를 사용하는 기업들과 단점 보완 전략

물론 JWT를 성공적으로 활용하는 기업들도 많다. 그런데 흥미로운 점은 이들이 JWT의 한계를 분명히 인식하고 다양한 전략으로 이를 보완한다는 사실이다.

### 구글 (Google)

구글은 Firebase Authentication, Google Cloud Platform, 그리고 다양한 API에서 JWT를 활용한다.

**단점 보완 전략:**
- **토큰 폐기 문제**: 짧은 만료 시간(보통 1시간 이내)을 설정하고, 리프레시 토큰 시스템을 운영
- **보안 강화**: 토큰의 서명에 강력한 RSA 알고리즘을 사용하며, 민감한 정보는 토큰에 저장하지 않음
- **벡터 검색 인증**: Vertex AI의 벡터 검색 기능에서 JWT를 활용한 인증 시스템 구현

구글의 JWT 구조는 다음과 같이 최소한의 정보만 포함한다.

```json
// 헤더
{
  "alg": "RS256",  // 강력한 RSA 서명 알고리즘
  "kid": "1234567890", 
  "typ": "JWT"
}
// 페이로드
{
  "sub": "user123",  // 최소한의 클레임만 포함
  "iss": "accounts.google.com",
  "exp": 1516239022,
  "iat": 1516235422
}
```

### 옥타 (Okta)

기업용 ID 및 액세스 관리 서비스를 제공하는 옥타는 JWT를 핵심 기술로 사용한다.

**단점 보완 전략:**
- **토큰 폐기**: 중앙 집중식 토큰 검증 서비스를 운영. 각 API 요청 시 토큰의 유효성을 실시간으로 확인할 수 있는 인프라를 구축
- **세션 유연성**: "Stateful JWT" 개념을 도입. 토큰 자체에는 최소한의 정보만 포함하고, 추가 정보는 ID를 통해 서버에서 조회
- **보안 강화**: 토큰 바인딩(Token Binding) 기술을 활용해 특정 장치나 브라우저에 토큰을 바인딩하여 토큰 탈취 위험 감소

옥타의 JWT 관리 흐름:

1. 사용자 인증 → JWT 발급
2. API 요청 시 JWT 제출
3. API 게이트웨이에서 JWT 유효성 검증
   - 서명 확인
   - 만료 여부 확인
   - 토큰 폐기 목록 확인
4. 필요시 추가 사용자 정보 조회

### 스포티파이 (Spotify)

스포티파이는 API 액세스와 마이크로서비스 간 통신에 JWT를 광범위하게 사용한다.
또한 2025년 초부터 보안 요구사항을 강화하고 있다.

**단점 보완 전략:**
- **하이브리드 접근법**: 짧은 수명의 액세스 토큰(JWT)과 서버에 저장된 리프레시 토큰을 조합
- **토큰 범위 제한**: 각 JWT에 명확한 범위(scope)를 설정하여 특정 API나 리소스에만 접근할 수 있도록 제한
- **보안 요구사항 강화**: 2025년 2월부터 모든 Spotify API 통합에 대해 강화된 보안 요구사항 적용
- **PKCE 흐름 의무화**: 모든 OAuth 인증 흐름에서 PKCE(Proof Key for Code Exchange) 사용 의무화

스포티파이의 토큰 관리 예시:
- 액세스 토큰: 15분 만료, JWT 형식
- 리프레시 토큰: 7일 만료, 서버 데이터베이스에 저장
- 보안 이벤트 발생 시(비밀번호 변경, 의심스러운 활동) 모든 토큰 즉시 무효화

## 4. 공통적인 JWT 보완 전략

대부분의 기업들이 JWT의 단점을 보완하기 위해 사용하는 전략들을 카테고리별로 살펴보자.

### 토큰 폐기 문제 해결
- **짧은 만료 시간**: 액세스 토큰의 수명을 15~60분으로 짧게 설정
- **리프레시 토큰 시스템**: 서버에 저장된 리프레시 토큰으로 새 액세스 토큰 발급
- **분산 캐시 활용**: Redis나 Memcached를 사용하여 폐기된 토큰 목록 관리
- **토큰 버전 관리**: 사용자 계정에 토큰 버전 번호를 부여하여 이전 버전의 토큰을 무효화

### 크기 문제 해결
- **최소 클레임**: 필수 정보만 JWT에 포함
- **참조 토큰**: 실제 데이터 대신 참조 ID만 포함하고 필요시 서버에서 조회
- **압축 알고리즘**: JWT 페이로드 압축으로 크기 감소
- **헤더 최적화**: 알고리즘 선택 시 컴팩트한 옵션 선호

### 보안 강화
- **토큰 바인딩**: 특정 디바이스나 핑거프린트에 토큰 바인딩
- **보안 헤더 추가**: `nbf`(Not Before), `jti`(JWT ID) 등의 보안 헤더 활용
- **PKCE 적용**: OAuth 흐름에서 PKCE를 사용하여 인증 코드 가로채기 공격 방지
- **JWT 저장 보안 강화**: 클라이언트 측에서 JWT를 안전하게 저장하기 위한 모범 사례 적용

### 세션 유연성 확보
- **하이브리드 접근법**: JWT와 서버 측 세션의 장점 결합
- **상태 분리**: 자주 변경되는 데이터는 서버에, 정적 인증 정보는 JWT에 저장
- **마이크로서비스별 토큰**: 각 서비스에 필요한 정보만 포함한 맞춤형 토큰 사용

## 5. 나의 생각: 대규모 서비스의 세션 관리 선택 기준

대규모 서비스를 설계할 때 세션 관리 방식을 선택하는 것은 단순한 `이것 아니면 저것` 의 결정이 아니다. 실제 대형 기술 기업들이 보여주듯이, 상황과 요구사항에 따라 **다양한 접근법**을 혼합하여 사용하는 것이 일반적이다.

내가 생각하는 선택 기준은 다음과 같다.

### 서버 측 세션이 더 적합한 경우:
- 사용자의 상태 정보가 자주 변경되는 경우 (예: 쇼핑 카트)
- 세션 데이터의 크기가 큰 경우
- 즉각적인 세션 종료 기능이 중요한 경우
- 민감한 사용자 정보를 다루는 경우

### JWT가 더 적합한 경우:
- 마이크로서비스 아키텍처를 사용하는 경우
- 서버 간 통신이 많은 경우
- 교차 도메인 인증이 필요한 경우
- 확장성이 최우선 과제인 경우

### 하이브리드 접근법이 필요한 경우:
- 사용자 인증과 복잡한 세션 상태 모두 관리해야 하는 경우
- 다양한 클라이언트 플랫폼(웹, 모바일, IoT 등)을 지원해야 하는 경우
- 서로 다른 보안 요구사항을 가진 다양한 API를 제공하는 경우

## 결론

세션 관리는 단순한 기술적 결정이 아닌, 비즈니스 요구사항, 보안 고려사항, 확장성 목표, 그리고 사용자 경험 등 다양한 요소를 **종합적으로 고려해야 하는 아키텍처 결정**이다.

대기업들의 사례에서 볼 수 있듯이, 대규모 서비스에서는 단일 솔루션보다는 상황에 맞는 **최적의 조합**을 찾는 것이 중요하다. Amazon, Facebook, Netflix는 각각 다른 접근 방식을 취했지만, 모두 자신들의 독특한 요구사항과 **기존 인프라에 최적화된 솔루션**을 개발했다.

또한 JWT를 사용하는 기업들도 단순히 JWT만 사용하는 것이 아니라, 다양한 **보완 전략**을 통해 JWT의 단점을 극복하고 있다. 이는 기술 선택에 있어 `완벽한 정답`은 없다는 걸 의미하는 것 같다.

결국 가장 중요한 것은 자신의 **서비스 특성을 정확히 이해**하고, 그에 맞는 최적의 세션 관리 전략을 설계하는 것이라고 생각한다. 완벽한 솔루션은 없지만, **장단점을 이해**하고 **적절히 보완**하는 접근법이 성공적인 대규모 서비스의 핵심이지 않을까...
언젠가 꼭 이런걸 현업에서 고민해보는 순간이 왔으면 좋겠다.

## 참고 자료

1. Amazon DynamoDB 세션 관리:
    
    - Amazon Web Services. (2025). "Using the DynamoDB session handler with AWS SDK for PHP Version 3." AWS Developer Guide. [https://docs.aws.amazon.com/sdk-for-php/v3/developer-guide/service_dynamodb-session-handler.html](https://docs.aws.amazon.com/sdk-for-php/v3/developer-guide/service_dynamodb-session-handler.html)
        
2. Facebook의 TAO 시스템:
    
	- [https://litport.net/blog/facebook-session-issues-a-developers-troubleshooting-guide-59958](https://litport.net/blog/facebook-session-issues-a-developers-troubleshooting-guide-59958)
        
3. Spring Session & Redis:
    
    - Spring. (2024). "Redis Configurations :: Spring Session." Spring Documentation. [https://docs.spring.io/spring-session/reference/configuration/redis.html](https://docs.spring.io/spring-session/reference/configuration/redis.html)
        
4. Google의 JWT 구현:
    
    - Google Cloud. (2025). "JSON Web Token authentication | Vertex AI." Google Cloud Documentation. [https://cloud.google.com/vertex-ai/docs/vector-search/jwt-auth](https://cloud.google.com/vertex-ai/docs/vector-search/jwt-auth)
        
5. JWT 보안 모범 사례:
    
    - GUVI. (2025). "7 JWT Security Best Practices to Protect Apps Against Threats." GUVI Blog. [https://www.guvi.in/blog/jwt-security-best-practices-to-protect-apps/](https://www.guvi.in/blog/jwt-security-best-practices-to-protect-apps/)
        
6. Okta의 세션 관리:
    
    - Okta. (2024). "Demo: Single Sign-On & Session Management (Session Control, IDP & SP initiated SSO)." Okta Documentation. [https://www.okta.com/demo/single-sign-on-session-management/](https://www.okta.com/demo/single-sign-on-session-management/)
        
    - Hoop.dev. (2024). "Mastering Okta Session Management: A Guide for Technology Managers." Hoop.dev Blog. [https://hoop.dev/blog/mastering-okta-session-management-a-guide-for-technology-managers/](https://hoop.dev/blog/mastering-okta-session-management-a-guide-for-technology-managers/)
        
7. Spotify의 인증 시스템:
    
    - Spotify Developer. (2025). "Increasing the security requirements for integrating with Spotify." Spotify Developer Blog. [https://developer.spotify.com/blog/2025-02-12-increasing-the-security-requirements-for-integrating-with-spotify](https://developer.spotify.com/blog/2025-02-12-increasing-the-security-requirements-for-integrating-with-spotify)
        
    - Spotify Developer. (2025). "Authorization - Spotify for Developers." Spotify Developer Documentation. [https://developer.spotify.com/documentation/web-api/concepts/authorization](https://developer.spotify.com/documentation/web-api/concepts/authorization)
        
8. 세션 관리 모범 사례:
    
    - WorkOS. (2025). "Session management best practices." WorkOS Blog. [https://workos.com/blog/session-management-best-practices](https://workos.com/blog/session-management-best-practices)
        
    - Stytch. (2024). "Session management best practices." Stytch Blog. [https://stytch.com/blog/session-management-best-practices/](https://stytch.com/blog/session-management-best-practices/)
        
    - DevOps.com. (2025). "Session Tokens Vs. JWTs: Choosing Your Session Management Solution." DevOps.com. [https://devops.com/session-tokens-vs-jwts-choosing-your-session-management-solution/](https://devops.com/session-tokens-vs-jwts-choosing-your-session-management-solution/)
        
9. JWT 저장 보안 모범 사례:
    
    - Syncfusion. (2025). "Secure JWT Storage: Best Practices." Syncfusion Blog. [https://www.syncfusion.com/blogs/post/secure-jwt-storage-best-practices](https://www.syncfusion.com/blogs/post/secure-jwt-storage-best-practices)
        
10. 세션 관리 구현:
    
    - Coding Shuttle. (2025). "User Sessions management with JWT." Coding Shuttle. [https://www.codingshuttle.com/spring-boot-hand-book/user-sessions-management-with-jwt](https://www.codingshuttle.com/spring-boot-hand-book/user-sessions-management-with-jwt)
