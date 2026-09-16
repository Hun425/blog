---
title: "Web, Servlet, Spring의 관계"
description: "DispatcherServlet이 어디서 동작하는지 아시나요?"
date: 2025-05-31
category: backend
tags: ["Spring", "servlet", "web"]
cover: ./cover.webp
velogUrl: https://velog.io/@chae0738/Web-Servlet-Spring%EC%9D%98-%EA%B4%80%EA%B3%84
---

### 들어가며

회사에서 개발을 진행하며 초기에는 Spring이였지만, Spring boot로 환경이 바뀌게 되었다.  Spring Boot로 프로젝트를 하다 보면 흔히 "톰캣 위에서 돌아가는 구조"라고만 알고 넘어가는 경우가 많은데.. 
하지만 막상 DispatcherServlet이 뭔지, Spring Container가 어디서 실행되는지, 그리고 톰캣은 실제로 어떤 역할을 하는지까지 명확하게 이해하지 못한 채 개발을 진행하는 경우도 많다. `내가 그랬던거 같다`

나는 실제 업무에서 Spring MVC에서의 URL 매핑 문제를 디버깅하다가 `RequestMappingHandlerMapping`을 타고 들어갔고, 그 흐름이 결국 `DispatcherServlet`, 나아가 `ServletContainer`와 `Spring Container`로 이어진다는 사실을 알게 되었다. 단순히 "컨트롤러가 매핑이 안 되네?"가 아니라, 컨트롤러 호출의 전제 조건이 되는 전체 구조를 제대로 이해해야 디버깅도, 확장도 정확히 할 수 있다는 걸 알게 되었다.

이 글에서는 Web Server, Servlet Container, Spring Container의 개념을 분리해 이해하고, Spring MVC가 요청을 어떻게 처리하는지에 대한 흐름을 실제 예시와 함께 정리해보았다.

---

### 1. 구성 요소별 개념 정리

|구성 요소|역할|예시|
|---|---|---|
|**Web Server**|HTTP 요청 수신, 정적 리소스 제공|Nginx, Apache, 톰캣 (HTTP 커넥터 기능 포함)|
|**Servlet Container**|서블릿 생명주기 관리 및 실행 (`HttpServlet`)|톰캣, Jetty, Undertow|
|**Spring Container**|Bean 생성, 의존성 주입, AOP, 트랜잭션 관리|ApplicationContext|

> 💡 톰캣은 Web Server + Servlet Container 기능을 모두 포함한 **경량 WAS**이다.

#### 실무 예시: 톰캣을 단독으로 쓸 때와 Nginx를 앞단에 둘 때

- 개발 환경에서는 `Spring Boot + 내장 톰캣` 구조를 사용하는 경우가 많다. 이 경우 Web Server와 Servlet Container, Spring Container가 한 프로세스 안에 존재한다.
- 반면 운영 환경에서는 보통 `Nginx (정적 리소스 + 리버스 프록시)` + `Tomcat (서블릿 컨테이너)` + `Spring` 구조로 분리하는 경우가 많다.

```bash
# Nginx 예시 설정 (리버스 프록시)
location /api/ {
  proxy_pass http://localhost:8080/;
}
```

---

### 2. 전체 구조 흐름도 (요청이 처리되는 순서)

```
[Web Browser]
    ↓ HTTP 요청
[Web Server]  ← ex) Nginx 또는 Tomcat HTTP 커넥터
    ↓
[Servlet Container]
    └─ DispatcherServlet (Spring이 등록한 HttpServlet)
         ↓
     [Spring Container (ApplicationContext)]
         └─ Controller, Service, Repository Bean 실행
```

이 중 DispatcherServlet이 핵심이다. Spring MVC에서는 이 서블릿이 프론트 컨트롤러로서 모든 요청을 가로채고, 이후 컨트롤러를 실행하는 전 과정(HandlerMapping → HandlerAdapter → ViewResolver)을 지휘한다.

---

### 3. 코드로 확인하는 DispatcherServlet 등록

Spring Boot는 DispatcherServlet을 자동으로 등록하지만, 전통적인 방식에서는 다음과 같이 수동 등록할 수도 있다.

```java
public class MyWebAppInitializer implements WebApplicationInitializer {
    @Override
    public void onStartup(ServletContext container) throws ServletException {
        AnnotationConfigWebApplicationContext context = new AnnotationConfigWebApplicationContext();
        context.register(MyWebConfig.class);

        DispatcherServlet dispatcherServlet = new DispatcherServlet(context);
        ServletRegistration.Dynamic registration = container.addServlet("dispatcher", dispatcherServlet);
        registration.setLoadOnStartup(1);
        registration.addMapping("/");
    }
}
```

- 이 코드는 Servlet Container가 기동될 때 DispatcherServlet을 등록하는 예이다.
- Spring Boot는 내부적으로 이를 자동화해준다.

---

### 4. Spring Container는 언제 만들어질까?

Spring Container는 DispatcherServlet이 초기화될 때 함께 생성된다.

1. 톰캣이 DispatcherServlet 인스턴스를 초기화
2. DispatcherServlet이 내부적으로 `WebApplicationContext`를 초기화
3. 이 WebApplicationContext가 Spring의 ApplicationContext 역할을 하며 Bean을 관리

```java
public class DispatcherServlet extends FrameworkServlet {
    @Override
    protected WebApplicationContext createWebApplicationContext(@Nullable WebApplicationContext parent) {
        // 내부에서 ApplicationContext 생성 및 초기화
    }
}
```

---

### 5. Spring이 서블릿 위에 올라간다는 말의 의미

> Spring은 독립된 어플리케이션이 아니라, **서블릿 환경에서 실행되는 프레임워크**이다.

Servlet Container가 없다면 DispatcherServlet도 존재할 수 없고, Spring MVC도 작동하지 않는다. 

---

### 6. 그림에서 왜 Web Server와 Servlet Container가 분리되어 있는가?

- 실제로는 톰캣이 두 역할을 모두 하기도 한다.
- 하지만 **아키텍처적으로 책임이 다르기 때문에** 개념적으로 분리해서 이해하는 것이 좋다.

|계층|역할|
|---|---|
|Web Server|HTTP 수신, 정적 리소스 제공, 리버스 프록시|
|Servlet Container|HttpServlet을 실행, 요청을 서블릿에 위임|
|DispatcherServlet|Spring MVC의 프론트 컨트롤러 역할 수행|
|Spring Container|Bean 관리, AOP, 트랜잭션, 서비스 계층 실행|

---

### 7. 실무에서 구조를 잘 이해해야 하는 이유

- 요청이 DispatcherServlet에 도달하기 전에 이미 **서블릿 매핑, 필터, 인코딩 설정**이 끝났을 수도 있다.
- DispatcherServlet 내부에서 Bean을 찾지 못하는 경우, Spring Container가 초기화되지 않았거나 서블릿과 연결이 안 되었을 가능성이 있다.
- 모놀리식 구조에서 MSA 구조로 넘어갈 때, Web Server와 Servlet Container 역할을 **물리적으로 분리하는 설계 결정**이 필요하다.

---

### 마치며

Spring MVC 구조를 겉으로 보면 단순한 것 같지만, 실제로 DispatcherServlet이 서블릿 위에 올라가 있다는 구조를 이해하지 못하면 디버깅이나 확장 작업에서 큰 어려움을 겪게 된다.

특히 "서블릿 컨테이너 위에 DispatcherServlet이 있고 그 안에서 Spring Container가 실행된다"는 개념은 실무에서 가장 많이 놓치는 부분 중 하나일 것 같다..

이번 공부를 하기전에는 흐름을 어렴풋이만 알고 있었지만 이제는 명확하게 알게 해주는, 좋은 공부였던 것 같다.

다음 편에서는 **HandlerMapping, HandlerAdapter, ViewResolver** 같은 구성요소에 대해서 더 깊게 공부해볼 예정이다.

---

### 참고자료

- [Spring 공식 문서 - DispatcherServlet](https://docs.spring.io/spring-framework/docs/current/reference/html/web.html#mvc-servlet)
- [Baeldung - Introduction to DispatcherServlet](https://www.baeldung.com/spring-dispatcherservlet)
- [Spring Boot WebApplicationInitializer 설명](https://www.baeldung.com/spring-boot-context-hierarchy)
