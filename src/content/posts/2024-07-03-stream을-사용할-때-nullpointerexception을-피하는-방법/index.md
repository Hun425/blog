---
title: "Stream을 사용할 때 NullPointerException을 피하는 방법"
description: "Spring 프로젝트 도중 생긴 오류의 트러블 슈팅"
date: 2024-07-03
category: backend
tags: ["Java", "Spring", "stream"]
cover: ./cover.png
velogUrl: https://velog.io/@chae0738/Stream%EC%9D%84-%EC%82%AC%EC%9A%A9%ED%95%A0-%EB%95%8C-NullPointerException%EC%9D%84-%ED%94%BC%ED%95%98%EB%8A%94-%EB%B0%A9%EB%B2%95
---

## 오류 발생

``` java
2024-07-03 21:47:45.670 ERROR 2056 --- [nio-8080-exec-3] o.a.c.c.C.[.[.[/].[dispatcherServlet]    : Servlet.service() for servlet [dispatcherServlet] in context with path [] threw exception 
[Request processing failed;nested exception is java.lang.NullPointerException: Cannot invoke "String.equals(Object)" because the return value of "hello.login.domain.member.Member.getLoginId()" is null] with root cause

java.lang.NullPointerException: Cannot invoke "String.equals(Object)" because the return value of "hello.login.domain.member.Member.getLoginId()" is null
```

## 원인 분석

``` java
return findAll().stream()  
        .filter(member -> member.getLoginId().equals(userId)).findFirst();
```

여기서 getLoginId()를 할때 null이 생기는 오류


## 해결 시도

```java
log.info("loginId = {}, password = {}",loginForm.getLoginId(), loginForm.getPassword());
```

1. 들어오는 파라미터값 로그로 출력 == 정상

``` java
log.info("findByLoginId : userId {}",userId);  
log.info("allUser = {}", findAll());
```
2. MemberRepository 로그로 출력 == 정상

```java
@PostConstruct 
public void init() { 
itemRepository.save(new Item("itemA", 10000, 10)); 
itemRepository.save(new Item("itemB", 20000, 20)); 

Member member = new Member();

member.setName("user"); // 오타로 인해 이 코드가 실행되지 않음
member.setPassword("asdf"); 
member.setName("테스트유저"); 
memberRepository.save(member); }
```

3. 사전 데이터 확인 == 오타 발견




## 결과

오타를 고치니, 다시 잘 작동되는 것을 확인했다.

## 추가 해결 방안

**PostConstruct**를 통해 setName을 **null** 값으로 넣어놓고 시작해서, 처음부터 **stream**으로 순회할 때, null 값을 찾아버리는 오류가 발생했다.



``` java
return findAll().stream() 
.filter(member -> member.getLoginId().equals(loginId)).findFirst();

return findAll().stream() 
.filter(member -> loginId.equals(member.getLoginId())) 
// loginId가 null인지 체크 .findFirst();
```

첫번째 구문은 getLoginId()가 null일 경우 **NullPointerException**이 발생,
하지만 두번째 구문은 loginId가 null이더라도, null.equeals(...)는 항상 false를 반환하므로 null에 관한 처리가 가능하다.

Stream을 사용해서 비교할 때, 순서만 신경써도 오류를 줄일 수 있다!
