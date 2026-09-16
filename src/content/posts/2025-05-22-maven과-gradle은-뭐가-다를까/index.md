---
title: "Maven과 Gradle은 뭐가 다를까?"
description: "빌드 도구 차이점 마스터하기"
date: 2025-05-22
category: backend
tags: ["gradle", "maven"]
cover: ./cover.png
velogUrl: https://velog.io/@chae0738/Maven%EA%B3%BC-Gradle%EC%9D%80-%EB%AD%90%EA%B0%80-%EB%8B%A4%EB%A5%BC%EA%B9%8C
---

## 최근 근황
최근에 가장 가고싶었던 기업의 면접을 보게되었다.
면접 경험도 너무 좋았고, 특히 나의 부족한 부분들을 많이 알게 되어서 더욱 뜻깊은 경험이였다.
최근들어 너무 바빠져서 타이트한 일정을 보내던 와중 드디어 여유가 생겼고, 
관련 내용을 하나씩 복기하면서 공부한 내용을 정리해보고자 한다.

---

## 1. 기본 철학과 구조의 차이

|항목|Maven|Gradle|
|---|---|---|
|출시년도|2004년|2012년|
|언어|XML|Groovy / Kotlin DSL|
|철학|Convention over Configuration|Configuration over Convention|
|특징|고정된 규칙, 예측 가능|유연하고 스크립트 기반|

 Maven은 "정해진 규칙에 따라 작성하면 무난히 빌드됨"이라는 장점이 있다. 반면 Gradle은 `if`, `for` 같은 조건문도 사용할 수 있어 **동적인 빌드 스크립트**가 가능하다.

🔍 예시 (Gradle):

```groovy
if (project.hasProperty('release')) {
    version = '1.0.0'
} else {
    version = '1.0.0-SNAPSHOT'
}
```

---

##  2. 의존성 관리 방식

- Maven: `pom.xml` 파일에 명시적으로 `<dependency>` 태그로 선언한다.
    

```xml
<dependency>
  <groupId>org.springframework</groupId>
  <artifactId>spring-core</artifactId>
  <version>5.3.22</version>
</dependency>
```

- Gradle: `build.gradle` 파일에서 한 줄로 선언한다.
    

```groovy
dependencies {
    implementation 'org.springframework:spring-core:5.3.22'
}
```

Gradle은 의존성 충돌 해결 전략을 직접 설정할 수 있어서 **복잡한 트랜지티브 의존성 문제**에 강하다.

---

## 3. 빌드 성능

|항목|Maven|Gradle|
|---|---|---|
|빌드 방식|전체 빌드|인크리멘탈 빌드 (변경된 파일만)|
|캐시|없음|있음 (local/remote cache)|
|데몬 프로세스|없음|있음 (build daemon)|

테스트 시 Gradle은 대규모 프로젝트에서 빌드 시간이 **최대 50% 이상 단축**되는 경우도 있다.

---

## 4. 플러그인과 생태계

Maven은 **안정적인 플러그인** 생태계를 가지고 있어, 예측 가능한 결과를 원할 때 적합하다.
    
Gradle은 **플러그인을 직접 만들거나 커스터마이징**하는 데 훨씬 유리하다.
    

💡 예: CI/CD 자동화를 위한 Jenkins 연동 스크립트를 Gradle에서는 쉽게 작성 가능하다.

``` groovy
task deployToServer {
    doLast {
        println "Deploying to server..."
    }
}
```

---

## 5. 실무 적용 사례 및 비교 요약

|상황|Maven|Gradle|
|---|---|---|
|공공기관, 금융권|✅ 안정성, 표준화|❌ 유연성 과도함|
|스타트업, 모바일|❌ 느린 빌드, 자동화 어려움|✅ 유연하고 빠름|
|Android 개발|❌ 비공식 도구|✅ 공식 빌드 도구|
|DevOps, 배포 자동화|❌ 제약 많음|✅ 스크립트 기반 유리|

🔍 실제 예:

- **대다수 정부 프로젝트**: XML 기반 관리가 쉽고 변경을 최소화해야 하므로 Maven을 사용함
    
- **쿠팡 Android 개발팀**: 빠른 배포와 유연한 커스터마이징이 필요해서 Gradle을 채택함
    

---

## 결론

Maven은 **정해진 규칙에 따라 안전하게** 프로젝트를 관리할 수 있어 대규모 조직에 적합하다. 반면 Gradle은 **자유롭고 성능이 뛰어나며**, 복잡한 빌드/배포 로직이 요구되는 환경에 적합하다.

개발을 처음 시작 할 때부터 gradle만 사용했었고 최근 회사에서 잠깐 maven을 보았을 때도, 
단순히 xml을 쓰냐 yml,properties를 쓰냐 이정도의 차이로만 인지하고 있었다.
하지만 이번 학습을 통해 단순히 도구를 사용하는 수준에서 벗어나, 각 빌드 도구의 철학과 구조, 그리고 실무에서의 활용 방향까지 고민해 보는 계기가 된 것 같다.
앞으로 어떤 상황에서 어떤 빌드 도구를 선택해야 할지 판단할 수 있는 눈이 되지 않을까.. 생각해본다.

## 참고자료


[Maven Build Lifecycle 공식 문서](
https://maven.apache.org/guides/introduction/introduction-to-the-lifecycle.html)

[Maven Build Lifecycle, Phases, and Goals - DigitalOcean](
https://www.digitalocean.com/community/tutorials/maven-build-lifecycle-phases-goals)


[Gradle vs. Maven 비교 - Gradle 공식 블로그](https://gradle.org/maven-and-gradle/)
