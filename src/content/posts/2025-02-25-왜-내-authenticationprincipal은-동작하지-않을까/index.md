---
title: "왜 나의 @AuthenticationPrincipal은 동작하지 않을까"
description: "Spring Security 설정 문제로 엿본 내부 동작 원리"
date: 2025-02-25
category: backend
tags: ["Java", "Spring", "Spring boot"]
cover: ./cover.jpg
velogUrl: https://velog.io/@chae0738/%EC%99%9C-%EB%82%B4-AuthenticationPrincipal%EC%9D%80-%EB%8F%99%EC%9E%91%ED%95%98%EC%A7%80-%EC%95%8A%EC%9D%84%EA%B9%8C
---

# Spring Context 설정에서 겪은 시행착오

Spring Security를 적용하다가 재미있는 상황을 겪었다. 
Spring Boot만 쓰다가 xml 설정을 처음해보면서 겪은 시행착오가 **Spring의 Context 구조**를 이해하게 된 계기가 되어서 기록으로 남겨둔다.

---

### 문제 발견 😲

처음에는 당연히 시큐리티 관련 설정이니까 **context-security.xml**에 넣으면 되겠지 하고 아래 설정을 추가했다.

```xml
<!-- context-security.xml -->
<bean class="org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver"/>
```

분명 설정은 제대로 했는데 `@AuthenticationPrincipal` 어노테이션이 동작하지 않았다. 그래서 이 설정을 **dispatcher-servlet.xml**로 옮겨봤다.

```xml
<!-- dispatcher-servlet.xml -->
<mvc:annotation-driven>
    <mvc:argument-resolvers>
        <bean class="org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver"/>
    </mvc:argument-resolvers>
</mvc:annotation-driven>
```

그랬더니 신기하게도 잘 동작했다.

---

### WAS에서 Spring까지의 흐름 🚶‍♂️

이 문제를 제대로 이해하려면 웹 요청이 **WAS**에서 **Spring**까지 어떻게 흘러가는지 알아야 한다고 생각해서 추가로 알아보았다.

#### 1. WAS(Web Application Server)의 시작
**WAS**가 구동되면서 **web.xml**을 읽는다. 이때 두 가지 중요한 작업이 일어난다:

```xml
<!-- web.xml -->
<!-- 1. ContextLoaderListener 등록 -->
<listener>
    <listener-class>org.springframework.web.context.ContextLoaderListener</listener-class>
</listener>

<!-- 2. Root Context 위치 지정 -->
<context-param>
    <param-name>contextConfigLocation</param-name>
    <param-value>
        /WEB-INF/spring/root-context.xml
        /WEB-INF/spring/context-security.xml
    </param-value>
</context-param>
```

여기서 `ContextLoaderListener`는 **Spring의 Root Context**를 생성하는 역할을 한다. 마치 건물을 지을 때 기초 공사를 하는 것과 같다.

#### 2. Root Context 생성
**Root Context**가 생성되면서 다음과 같은 일들이 일어난다.

```plaintext
1. context-security.xml, root-context.xml 등을 로드
2. 데이터베이스 연결 설정 초기화
3. 트랜잭션 매니저 생성
4. 보안 필터 체인 구성
```

이것은 마치 건물의 전기, 수도, 보안 시스템을 설치하는 것과 같다.

#### 3. DispatcherServlet 초기화
그 다음 **DispatcherServlet**이 초기화된다.

```xml
<!-- web.xml -->
<servlet>
    <servlet-name>appServlet</servlet-name>
    <servlet-class>org.springframework.web.servlet.DispatcherServlet</servlet-class>
    <init-param>
        <param-name>contextConfigLocation</param-name>
        <param-value>/WEB-INF/spring/appServlet/servlet-context.xml</param-value>
    </init-param>
    <load-on-startup>1</load-on-startup>
</servlet>
```

**DispatcherServlet**은 자신만의 **Context(Servlet Context)**를 생성한다. 
이는 마치 건물 안에 각 부서의 사무실을 만드는 것과 같다.

#### 4. 실제 요청의 흐름

사용자가 웹 페이지를 요청하면 다음과 같은 흐름으로 처리된다.

```plaintext
브라우저 요청
    ↓
WAS (Tomcat)
    ↓
web.xml 설정 확인
    ↓
DispatcherServlet (프론트 컨트롤러)
    ↓
핸들러 매핑 (어떤 컨트롤러가 처리할지 결정)
    ↓
컨트롤러 실행 (@AuthenticationPrincipal 처리)
    ↓
서비스 계층 (Root Context의 빈들 사용)
```

이제 왜 `@AuthenticationPrincipal` 설정이 **dispatcher-servlet.xml**에 있어야 하는지 이해가 된다. 컨트롤러의 파라미터를 처리하는 **ArgumentResolver**는 요청을 처리하는 시점에 필요하기 때문이다!

---

### Spring Boot는 어떻게 다를까? 🤔

지금까지 본 복잡한 설정들을 **Spring Boot**는 어떻게 처리하는지 살펴보자.

#### 1. 설정 파일의 자동화
**Spring Legacy**에서는
```xml
<!-- web.xml -->
<listener>
    <listener-class>org.springframework.web.context.ContextLoaderListener</listener-class>
</listener>
<context-param>
    <param-name>contextConfigLocation</param-name>
    <param-value>/WEB-INF/spring/root-context.xml</param-value>
</context-param>
```

**Spring Boot**에서는
```java
@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

이게 끝이다. `@SpringBootApplication` 하나로 설정이 **자동화**된다. `그립다..`

#### 2. Context 구조의 자동 구성

Spring Legacy에서 해야 했던 일들은
1. **Root Context** 설정 (context-*.xml)
2. **Servlet Context** 설정 (dispatcher-servlet.xml)
3. **web.xml**에 각종 설정 추가

**Spring Boot**에서는
```java
@Configuration
public class SecurityConfig extends WebSecurityConfigurerAdapter {
    // 보안 설정
}

@Controller
public class UserController {
    @GetMapping("/profile")
    public String profile(@AuthenticationPrincipal UserDetails userDetails) {
        // 메소드 내용
    }
}
```

- **XML 설정 파일**이 사라졌다
- **Context 구조**를 명시적으로 설정할 필요가 없다
- `@AuthenticationPrincipal`도 **자동**으로 처리된다

#### 3. 자동 설정의 동작 원리

**Spring Boot**가 시작되면
1. `@SpringBootApplication`이 **컴포넌트 스캔**을 시작
2. `spring-boot-autoconfigure` 라이브러리가 각종 자동 설정 클래스를 로드
3. classpath에 있는 라이브러리를 보고 필요한 설정을 자동으로 구성

예를 들어
- spring-boot-starter-web이 있으면 **DispatcherServlet** 자동 구성
- spring-boot-starter-security가 있으면 **보안 설정 자동 구성**

```java
// Spring Boot의 자동 설정 예시
@Configuration
@ConditionalOnWebApplication
@ConditionalOnClass({ AuthenticationManager.class })
@EnableWebSecurity
public class SecurityAutoConfiguration {
    // 보안 관련 자동 설정
}
```

#### 4. 설정 커스터마이징

물론 자동 설정을 **커스터마이징**할 수도 있다

```java
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        // 필요한 ArgumentResolver 추가
    }
}
```

---

### 결론

단순히 "여기 넣으니까 됐다/안됐다"로 끝날 수 있는 문제였지만, 이를 통해 Spring의 Context 구조와 설계 철학을 더 깊이 이해하게 됐다. Spring Boot가 이런 **복잡한 설정들을 자동화**해주는 것도 이제 보니 더 깊이 이해가 된다.

또한 SSAFY에서는 부트만 사용하다보니 내부적으로 이런 흐름을 위한 세세한 설정을 처음 해봐서 더 많은 공부가 되는 동시에 스프링 부트가 그리워졌다...... 
하지만 부트만 사용한다 해도, 이러한 **내부적 흐름**이나 xml에 대한 지식들이 **문제해결과 최적화**에 꼭 필요하겠다는 생각이 들었다.

Spring Boot는 `설정보다 관습(Convention over Configuration)`이라는 철학을 따르면서, 우리가 앞서 본 복잡한 설정들을 최대한 **자동화**했다. 하지만 그 내부에서는 여전히 같은 Spring Context 구조가 동작하고 있다는 점을 항상 생각하고 공부해야겠다고 다짐하는 계기가 되었다.
