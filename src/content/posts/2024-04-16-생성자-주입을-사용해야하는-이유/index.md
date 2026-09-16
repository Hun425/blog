---
title: "생성자 주입을 사용해야하는 이유"
description: "의존성 주입의 방법중의 하나이다.그 많은 방법 중에서 왜 생성자 주입을 사용해야 하는지 알아보자.말 그대로 생성자를 통한 의존 관계를 주입하는 방법이다불변대부분의 의존 관계는 한번 정해지면, 애플리케이션 구동이 끝날때까지 변하지 않는다객체를 생성할 때 한번만 호출되므로"
date: 2024-04-16
category: backend
tags: ["Spring"]
cover: ./cover.png
velogUrl: https://velog.io/@chae0738/%EC%83%9D%EC%84%B1%EC%9E%90-%EC%A3%BC%EC%9E%85%EC%9D%84-%EC%82%AC%EC%9A%A9%ED%95%B4%EC%95%BC%ED%95%98%EB%8A%94-%EC%9D%B4%EC%9C%A0
---

#### 생성자 주입이란?
- 의존성 주입의 방법중의 하나이다.

그 많은 방법 중에서 왜 **생성자 주입**을 사용해야 하는지 알아보자.

## 의존성 주입의 여러가지 방법

### 1. 생성자 주입 `Constructor Injection`
- 말 그대로 생성자를 통한 의존 관계를 주입하는 방법이다
``` java
@Component  
public class OrderServiceImpl implements OrderService{  
    private MemberRepository memberRepository;  
    private DiscountPolicy discountPolicy;  
  
  
  
    @Autowired  // 생성자가 하나일 경우 생략이 가능하다
    public OrderServiceImpl(MemberRepository memberRepository, DiscountPolicy discountPolicy) {  
        this.memberRepository = memberRepository;  
        this.discountPolicy = discountPolicy;  
    }

...
```

#### 생성자 주입의 특징
1. 불변
	1. 대부분의 의존 관계는 한번 정해지면, 애플리케이션 구동이 끝날때까지 **변하지 않는다**
	2. 객체를 생성할 때 **한번만 호출**되므로 이후에 호출되지 않는다.
2. 누락
	1. 개발자의 실수로 인한 테스트 오류를 final을 통해 **컴파일 단계**에서 막을 수 있다.

``` java
@Component  
public class OrderServiceImpl implements OrderService{  
    private final MemberRepository memberRepository;  // final로 미리 오류를 방지
    private final DiscountPolicy discountPolicy;  
  
  
  
    @Autowired  
    public OrderServiceImpl(MemberRepository memberRepository, DiscountPolicy discountPolicy) {  
        this.memberRepository = memberRepository;  
        this.discountPolicy = discountPolicy;  
    }

```



### 2. 수정자 주입 `Setter Injection`
- 필드 값을 변경하는 메서드인 `Setter`을 통해서 의존 관계를 주입하는 방법이다.
``` java
public class OrderServiceImpl implements OrderService{  
    private MemberRepository memberRepository;  // final을 사용할 수 없다!
    private DiscountPolicy discountPolicy;  
  
    public void setDiscountPolicy(DiscountPolicy discountPolicy) {  
        this.discountPolicy = discountPolicy;  
    }  
  
    public void setMemberRepository(MemberRepository memberRepository) {  
        this.memberRepository = memberRepository;  
    }
```


#### 수정자 주입의 특징
1. 주입받는 객체가 애플리케이션 **구동 중간에 변경될 가능성**이 있는 경우에 사용한다.
2. 중간에 변경되는 경우는 극히 드물기 때문에 잘 사용하지 않는다.


### 3. 필드 주입 `Field Injection`
- 필드에서 생성자나 수정자를 거치지 않고 바로 주입하는 방식이다.
``` java
@Component  
public class OrderServiceImpl implements OrderService{  
    @Autowired  
    private MemberRepository memberRepository;  
    @Autowired  
    private DiscountPolicy discountPolicy;
```


#### 필드 주입의 특징
1. 코드가 간결해진다
2. **외부에서 접근이 불가능해진다**
3. 2번의 이유로 인해서 현재는 거의 사용하지 않는다
4. DI 프레임워크가 필수적이다


## 왜 생성자 주입을 사용해야 할까

의존성 주입 방법에는 각각의 **장점과 단점**이 혼재한다
하지만 최근 트렌드는 **생성자 주입**을 사용하라고 권장한다. 

1. **프레임워크에 의존**하지 않는다 `필드 주입 참조`
2. **final** 키워드를 사용가능하다 `컴파일 단계에서 오류를 잡는다`
3. **Lombok**과 결합이 가능하다 `코드가 간결해진다`
4. **순환참조**가 방지된다 `스프링 2.6이하 버전에서만 해당`


위와 같은 이유들 때문에 기본으로 **생성자 주입**을 사용한 후, 수정자 주입 방식을 옵션으로 부여하는게 좋다.


### 참고
- https://www.inflearn.com/course/스프링-핵심-원리-기본편
