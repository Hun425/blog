---
title: "@Autowired 사용시 주의사항"
description: "Spring Framework에서 DI Dependency Injection를 할 때 사용하는 어노테이션 Annotaion이다.@Autowired는 타입 클래스이름을 통해 Bean을 조회 한다.그렇다면 Bean이 다수일 경우에는 어떻게 될까?조회 타입 1개를 기대했는데"
date: 2024-04-17
category: backend
tags: ["Spring"]
cover: ./cover.png
velogUrl: https://velog.io/@chae0738/autowired-%EC%82%AC%EC%9A%A9%EC%8B%9C-%EC%A3%BC%EC%9D%98%EC%82%AC%ED%95%AD
---

### @Autowired 란

Spring Framework에서 DI `Dependency Injection`를 할 때 사용하는 어노테이션 `Annotaion`이다.


## 조회 타입

`@Autowired`는 타입 `클래스이름`을 통해 `Bean`을 조회 한다.

그렇다면 `Bean`이 다수일 경우에는 어떻게 될까?

## Bean이 다수일 경우

### 오류 발생

```
Unsatisfied dependency expressed through constructor parameter 1: No qualifying bean of type 'hello.core.discount.DiscountPolicy' available: expected single matching bean but found 2: fixDiscountPolicy,rateDiscountPolicy
```

**조회 타입 1개**를 기대했는데, **2개** `혹은 여러개`가 있다는 오류를 발생시킨다.

이는 조회의 **기본 `Defaul`값이 1개**로 설정되어있고, 2개 이상이면 오류를 발생하도록 되어있기 때문이다.


### 해결 방법

#### 1. @Autowired를 필드명으로 매칭

@Autowired는 타입 매칭을 시도하고, 이때 빈이 여러개가 있으면 먼저 **파라미터 이름**으로 빈 이름을 추가 매칭시도한다.


#### 2. @Qualifier 사용

`@qualifier`는 **추가 구분자**를 붙이는 방법이다. 각 빈을 구분하는 추가적인 방법을 제공하는 것일 뿐, **빈 이름을 변경하는 것은 아니다**

``` java
@Autowired  // discountPolicy가 여러개일 경우 각각의 구분자로 구분하는 방법
public OrderServiceImpl(MemberRepository memberRepository,@Qualifier("rate") DiscountPolicy discountPolicy) {  
    this.memberRepository = memberRepository;  
    this.discountPolicy = discountPolicy;  
}
```


직접 빈을 등록하는 경우에도 가능하다.

``` java
@Bean  
@Qualifier("member")  
public MemberService memberService(){  
    System.out.println("call AppConfig.memberService");  
    return new MemberServiceImpl(memberRepository());  
}
```


#### 3. @Primary 사용

`@Primary`는 **우선순위**를 부여하는 방법이다
여러 Bean이 존재하면 `@Primary`를 가진 빈이 **우선권**을 가진다

``` java
@Component  
@Primary            // 둘 중에서는 Primary가 조회된다!
public class RateDiscountPolicy implements  DiscountPolicy{
...


@Component  
public class FixDiscountPolicy implements DiscountPolicy{
...


```


#### 예외 상황

그렇다면 `@Primary`와 `@Qualifier`이 둘 다 존재한다면 어떤것이 **우선순위**를 가질까?

스프링은 자동보다는 **수동**, 넓은 범위의 선택 보다는 **좁은 범위**의 선택이 우선순위를 가진다

`@Primary`는 기본값 `넓게 적용`으로 적용시키는 것이고

`@Qualifier`은 상대적으로 더 상세하게 동작한다.

따라서 `@Qualifier`가 **우선권**을 가진다!


#### 참고
- https://www.inflearn.com/course/스프링-핵심-원리-기본편
