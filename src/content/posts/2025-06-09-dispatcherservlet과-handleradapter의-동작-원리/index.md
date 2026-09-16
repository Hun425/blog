---
title: "DispatcherServlet과 HandlerAdapter의 동작 원리"
description: "디버깅 하려면 흐름정도는 알아야지"
date: 2025-06-09
category: backend
tags: []
cover: ./cover.webp
velogUrl: https://velog.io/@chae0738/DispatcherServlet%EA%B3%BC-HandlerAdapter%EC%9D%98-%EB%8F%99%EC%9E%91-%EC%9B%90%EB%A6%AC
---

### 들어가며

오늘은 회사에서 디버깅하다가 알게된 내용을 정리하며 추가로 궁금한 점들이 생겨 공부한 것들을 정리해보고자 한다. [이전편 보러가기](https://velog.io/@chae0738/Web-Servlet-Spring%EC%9D%98-%EA%B4%80%EA%B3%84)

Spring MVC에서 가장 처음 실행되는 클래스가 `DispatcherServlet`이라는 것은 이제 많은 개발자들이 알고 있다. 하지만 실제로 요청을 어떤 방식으로 Controller에게 전달하고 있는지, 그리고 내부적으로 HandlerMapping과 HandlerAdapter가 어떤 역할을 하고 있는지는 의외로 많은 사람`나 같은 사람..`들이 정확히 이해하지 못하고 있을 것 같다.

나 역시 `RequestMappingHandlerMapping`을 디버깅하다가 "Controller는 언제 호출되는 거지?"라는 의문이 들어 흐름을 따라가보았고, 결국 Spring MVC가 어댑터 패턴을 통해 유연한 구조를 지니고 있다는 것을 알게 되었다.

이번 글에서는 DispatcherServlet의 동작 구조와 HandlerMapping, HandlerAdapter의 역할을 실전 예시와 함께 정리하고자 한다.

---

### 1. DispatcherServlet의 핵심 역할

DispatcherServlet은 하나의 HttpServlet이다. 따라서 서블릿 컨테이너가 HTTP 요청을 전달하면, `service()` 메서드를 타고 내부적으로 doGet, doPost 등이 실행된다. Spring MVC는 이 로직을 `doDispatch()` 내부에 집중시켜 관리하고 있다.

```java
protected void doDispatch(HttpServletRequest request, HttpServletResponse response) throws Exception {
    HandlerExecutionChain mappedHandler = getHandler(request);
    HandlerAdapter ha = getHandlerAdapter(mappedHandler.getHandler());
    ModelAndView mv = ha.handle(request, response, mappedHandler.getHandler());
    render(mv);
}
```

여기서 핵심은 `getHandler()`로 핸들러(Controller)를 찾고, 그에 맞는 `HandlerAdapter`를 선택한 뒤 실행(`handle()`)한다는 점이다.

이때 `HandlerExecutionChain` 객체는 단순히 Controller 객체만 반환하는 것이 아니라, **해당 컨트롤러와 함께 실행될 Interceptor 체인**도 포함하고 있다.

```java
public class HandlerExecutionChain {
    private final Object handler; // 실제 Controller
    private final List<HandlerInterceptor> interceptors;
    // ... 생략
}
```

따라서 DispatcherServlet은 Controller 호출 전/후로 preHandle(), postHandle()을 차례로 실행하면서 인증, 로깅, 권한 체크 등을 처리할 수 있다.

---

### 2. HandlerMapping: 어떤 컨트롤러를 호출할 것인가?

HandlerMapping은 URL, HTTP 메서드, 파라미터 등 다양한 조건에 따라 어떤 Controller가 처리해야 할지를 결정하는 인터페이스이다.

스프링에서는 대표적으로 다음과 같은 구현체들이 존재한다:

|구현체|역할|
|---|---|
|`RequestMappingHandlerMapping`|@RequestMapping 기반의 컨트롤러 매핑|
|`BeanNameUrlHandlerMapping`|Bean 이름과 URL 매핑|
|`SimpleUrlHandlerMapping`|XML 설정 기반 매핑|

개발자가 흔히 쓰는 `@RequestMapping`은 `RequestMappingHandlerMapping`이 처리한다.

```java
public class RequestMappingHandlerMapping extends AbstractHandlerMethodMapping<RequestMappingInfo> {
    // 내부적으로 Mapping 정보를 기반으로 Controller를 탐색함
}
```

즉, 이 단계에서는 **어떤 핸들러가 요청을 처리할지**를 결정한다.

---

### 3. HandlerAdapter: 어떻게 실행할 것인가?

HandlerAdapter는 핸들러의 실행 방식을 결정하는 인터페이스다. 단순히 핸들러를 찾는 것에서 끝나는 것이 아니라, **실제로 그 핸들러(Controller)를 실행**하는 로직은 이 어댑터에 위임된다.

대표적인 구현체는 다음과 같다:

|구현체|설명|
|---|---|
|`RequestMappingHandlerAdapter`|@RequestMapping 기반 컨트롤러 실행|
|`HttpRequestHandlerAdapter`|`HttpRequestHandler` 인터페이스 기반 실행|
|`SimpleControllerHandlerAdapter`|`Controller` 인터페이스 기반 실행|

Spring Boot에서는 기본적으로 `RequestMappingHandlerAdapter`가 사용된다.

```java
public class RequestMappingHandlerAdapter implements HandlerAdapter {
    @Override
    public ModelAndView handle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // 요청 파라미터 → 메서드 파라미터 변환
        // 컨트롤러 메서드 실행 (invoke)
        // 결과를 ModelAndView로 래핑
    }
}
```

여기서 handler 객체는 `@Controller`의 실제 인스턴스와 메서드를 포함한 `HandlerMethod` 타입으로 감싸져 있다.

---

### 4. 왜 HandlerAdapter가 필요한가? (어댑터 패턴 적용 이유)

Spring MVC는 다양한 유형의 Controller를 지원한다. 과거에는 `Controller 인터페이스`, 이후에는 `@RequestMapping`, 최근에는 `@GetMapping`, `@RestController` 등도 등장했다.

이처럼 다양한 핸들러 타입을 유연하게 처리하려면 핸들러를 일관되게 실행할 수 있는 어댑터가 필요하다. 이는 **Adapter Pattern(어댑터 패턴)** 의 대표적인 예로, 인터페이스가 다른 여러 객체들을 동일한 방식으로 처리할 수 있도록 만들어준다.

따라서 DispatcherServlet은 다음과 같은 방식으로 동작한다:

```
1. HandlerMapping을 통해 핸들러(Controller)를 찾고
2. HandlerAdapter를 통해 해당 핸들러를 실행
3. 반환 결과(ModelAndView)를 ViewResolver에게 전달
```

---

### 5. 스프링 필터 vs 인터셉터

앞선 내용에서 인터셉터의 내용이 나왔는데, 자칫 잘못하면 필터와 헷갈릴 수 있다.
Spring MVC에서 인터셉터와 필터는 다음 두 종류로 나눠 생각할 수 있다

| 필터 종류                  | 위치                     | 적용 시점                | 예시                                        |
| ---------------------- | ---------------------- | -------------------- | ----------------------------------------- |
| **Servlet Filter**     | DispatcherServlet "외부" | WAS 레벨에서 HTTP 요청 전/후 | `CharacterEncodingFilter`, `CORSFilter` 등 |
| **Spring Interceptor** | DispatcherServlet "내부" | Controller 호출 전/후    | 인증, 로깅, 트랜잭션 시작 등                         |

즉, **서블릿 필터는 전역적인 요청을 제어**하고, **Interceptor는 Spring MVC 구조 안에서의 흐름을 제어**한다.

```text
클라이언트 요청
  ↓
[Filter] → WAS 레벨
  ↓
[DispatcherServlet]
  ↓
[Interceptor (preHandle)]
  ↓
[Controller 실행]
  ↓
[Interceptor (postHandle, afterCompletion)]
  ↓
[Filter 응답 처리]
```

실무에서는 인증 토큰 검사, CORS 설정은 Filter에서 수행하고, 로깅이나 트랜잭션 관리는 Interceptor에서 수행하는 것이 일반적이다.

---

### 6. 실무에서 이해가 중요한 이유

- 컨트롤러가 호출되지 않는 문제 발생 시, HandlerMapping이 정확히 작동하는지 확인해야 한다.
    
- 커스텀 핸들러를 등록하려면 HandlerAdapter를 별도로 구현하거나 기존 구현체를 확장해야 한다.
    
- `HandlerExecutionChain`에 등록된 Interceptor가 비즈니스 흐름에 영향을 줄 수 있으므로, Interceptor 등록 순서도 중요하다.
    
- Spring WebFlux 등 비동기 처리 방식에서는 또 다른 DispatcherHandler 구조가 사용되므로, MVC 방식의 구조를 명확히 이해하고 있어야 한다.
    
- Filter vs Interceptor 개념을 정확히 이해하고, 적절한 책임 분리를 할 수 있어야 운영상의 오류를 줄일 수 있다.


---

### 마치며

이번 글에서는 Spring MVC에서의 요청 처리 핵심 흐름인 DispatcherServlet → HandlerMapping → HandlerAdapter에 대해 구조적으로 정리해보았다.

Controller가 어떻게 실행되는지는 단순한 매핑 이상의 구조적인 흐름 속에서 이루어진다. 
특히 어댑터 패턴을 통해 다양한 타입의 핸들러를 통합적으로 관리하는 Spring의 설계는 실무에서 확장성과 유지보수를 크게 향상시킨다. 
이걸 공부하기 전에는 헥사고날 아키텍처나 msa에서만 어댑터 패턴이 쓰이는 줄 알았다... 
`기본기부터 다지자 ㅜㅜ`

다음 글에서는 ViewResolver의 동작 원리와 DispatcherServlet이 응답을 렌더링하는 과정을 다룰 예정이다.

---

### 참고자료

- [Spring DispatcherServlet 구조 설명 (공식 문서)](https://docs.spring.io/spring-framework/docs/current/reference/html/web.html#mvc-servlet)
- [Spring MVC – Servlet Filter vs Handler Interceptor (GeeksforGeeks)](https://www.geeksforgeeks.org/spring-mvc-servlet-filter-vs-handler-interceptor/)
- [HandlerInterceptors vs. Filters in Spring MVC (Baeldung)](https://www.baeldung.com/spring-mvc-handlerinterceptor-vs-filter)
- [Difference Between Filters and Interceptors in Spring Boot (Medium – 2025)](https://medium.com/@vino7tech/difference-between-filters-and-interceptors-in-spring-boot-852de6164d04)
