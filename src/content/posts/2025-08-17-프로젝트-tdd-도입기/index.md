---
title: "프로젝트 TDD 도입기"
description: "Kotlin 프로젝트에 TDD 도입해보기"
date: 2025-08-17
category: backend
tags: ["TDD", "kotlin"]
cover: ./cover.jpg
velogUrl: https://velog.io/@chae0738/%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8-TDD-%EB%8F%84%EC%9E%85%EA%B8%B0
---

## 들어가며

최근 회사의 야근과 여행 일정 계획 수립 등이 겹치면서 블로그글을 작성하지 못했었다. 
이번 여행은 대학생부터 매년 2회씩 (여름, 겨울) 고정으로 워터파크 - 스키장 을 다니는 고정파티로 다행히 모두가 일정이 맞춰서 갈 수 있었고, 충분히 리프래쉬 하고 와서 하반기 목표를 향해 달려 갈 수 있는 원동력이 될 것 같다.

이번에는  나는  [AlgoReport](https://www.google.com/search?q=https://github.com/hun425/algoreport "null") 프로젝트를 진행하며 Test-Driven Development (TDD)를 핵심 개발 문화로 삼았다. 많은 개발자들이 TDD의 `Red-Green-Refactor` 사이클에 대해 알고 있지만, 가장 첫 단계인 '실패하는 테스트(Red)를 제대로 작성하는 법'에 대해서는 깊이 고민하지 않는 경우가 많을 거라고 생각한다.`나처럼..` 
나 역시 프로젝트 초기에 Kotest의 `BehaviorSpec`을 사용하면서 여러 시행착오를 겪었다.

이 글에서는 내 실제 경험을 바탕으로, 내가 프로젝트에 TDD를 도입하며 겪은 고찰과 실수들에 대해서 공유해보고자 한다. 어떻게 하면 더 나은 'Red' 단계를 만들고, Kotest의 함정을 피해 견고한 테스트 문화를 구축할 수 있는지를 고민한 내용을 중심으로 써 볼 예정이다.

## 🔴 Red 단계, 그냥 실패만 하면 될까?

TDD의 첫 단계는 실패하는 테스트를 작성하는 것이다. 하지만 '실패'에도 좋은 실패와 나쁜 실패가 있었다.

### 나쁜 실패: 테스트가 아예 실행되지 못하는 경우

프로젝트 초기, 나는 다음과 같은 실수를 저지르곤 했다.

**1. 구현체가 없어 컴파일조차 실패하는 테스트**

```
// 테스트만 덩그러니 작성된 상태
class SolvedacLinkSagaTest {
    @Test
    fun `solved.ac 계정을 연동할 수 있어야 한다`() {
        val saga = SolvedacLinkSaga() // 💥 컴파일 에러 SolvedacLinkSaga 클래스가 없음
        // ...
    }
}
```

이 방식은 테스트를 실행조차 할 수 없어 TDD 사이클이 시작되지 않았다.

**2. `NotImplementedError`로 테스트가 중단되는 경우**

```
// 컴파일 에러를 피하기 위해 껍데기만 만든 구현체
class SolvedacLinkSaga {
    fun start(request: SolvedacLinkRequest): SolvedacLinkResult {
        TODO("아직 구현 안 됨")  // 💥 테스트 실행 시 여기서 NotImplementedError 발생
    }
}
```

이 역시 테스트가 `assertion` 단계까지 도달하지 못하고 중간에 멈추기 때문에, 무엇을 검증하려 했는지 명확히 알 수 없는 '나쁜 실패'였다.

### 좋은 실패: 의도한 대로 '검증'에 실패하는 테스트

TDD의 창시자 켄트 벡이 말한 `Fake It ('til you make it)` 전략을 사용하는 것이 정답이었다. 즉, 테스트가 컴파일되고 실행되어 최종 `assertion` 구문에서 실패하도록 만드는 것이다.

```
// ✅ 올바른 RED 단계 구현체
class SolvedacLinkSaga {
    fun start(request: SolvedacLinkRequest): SolvedacLinkResult {
        // 실제 로직 없이, 테스트가 요구하는 반환 타입의 가장 간단한 '가짜' 값을 반환한다.
        return SolvedacLinkResult(
            sagaStatus = SagaStatus.PENDING, // 테스트는 COMPLETED를 기대하므로 실패
            linkedHandle = null,             // 테스트는 실제 핸들 값을 기대하므로 실패
            errorMessage = null
        )
    }
}
```

이 테스트는 `result.sagaStatus shouldBe SagaStatus.COMPLETED` 구문에서 **명확한 이유를 가지고 실패**했다. 이 방법이 아까보다 훨씬 '좋은 실패'다. 이 실패는 "이제 `sagaStatus`가 `COMPLETED`가 되도록 실제 로직을 구현하라"는 명확한 다음 목표를 제시하기 때문이다.

## 🚨 Kotest BehaviorSpec의 함정: 내가 빠졌던 두 가지 실수

Kotest의 `BehaviorSpec`은 BDD 스타일의 테스트를 작성하는 데 매우 유용하지만, 실행 순서와 데이터 생명주기를 정확히 이해하지 못하면 디버깅이 어려운 테스트 실패를 겪게 된다. 내가 `CreateGroupSagaTest`와 `PersonalStatsRefreshSagaUnitTest`를 작성하며 겪었던 대표적인 두 가지 함정은..

### 1. 데이터 생명주기: "분명 데이터를 넣었는데 왜 없지?"

`CreateGroupSagaTest`를 작성할 때였다. 그룹을 생성하려면 먼저 그룹장이 될 사용자가 존재해야 했다. 나는 자연스럽게 `given` 블록에서 테스트용 사용자를 생성했다.

```
// ❌ 문제가 발생했던 초기 테스트 코드
init {
    beforeEach {
        userService.clear() // 😱 각 then 블록이 실행되기 직전에 모든 데이터를 삭제!
    }

    given("CREATE_GROUP_SAGA가 실행될 때") {
        val testUser = userService.createUser(...) // 1. 여기서 사용자 생성
        val ownerId = testUser.id

        then("스터디 그룹이 성공적으로 생성되어야 한다") {
            // 2. 이 코드가 실행되기 직전, beforeEach가 호출되어 testUser가 삭제됨!
            val request = CreateGroupRequest(ownerId = ownerId, ...)
            val result = createGroupSaga.start(request) // 💥 "사용자를 찾을 수 없습니다" 예외 발생!
        }
    }
}
```

원인은 `beforeEach`의 실행 시점이었다. `beforeEach`는 **각 `then` 블록이 실행되기 직전에** 호출된다. 따라서 `given`에서 생성한 사용자는 첫 번째 `then` 블록이 실행되기도 전에 `userService.clear()`에 의해 삭제되었던 것이다.

이 문제는 우리 프로젝트의 `TDD_GUIDE.md`와 `CODING_STANDARDS.md`에 기록될 만큼 중요한 교훈이었다.

```
// ✅ 문제를 해결한 코드
init {
    beforeEach {
        userService.clear()
    }

    given("CREATE_GROUP_SAGA가 실행될 때") {
        then("스터디 그룹이 성공적으로 생성되어야 한다") {
            // then 블록 안에서 테스트에 필요한 데이터를 생성하여 완벽히 격리
            val testUser = userService.createUser(...)
            val ownerId = testUser.id

            val request = CreateGroupRequest(ownerId = ownerId, ...)
            val result = createGroupSaga.start(request) // ✅ 정상 실행

            result.sagaStatus shouldBe SagaStatus.COMPLETED
        }
    }
}
```

**교훈: Kotest `BehaviorSpec`에서 테스트 데이터는 `given`이나 `when`이 아닌, 실행 단위인 `then` 블록 내부에서 생성하여 테스트의 격리성을 보장해야 했다.**

### 2. Mock 객체 공유: "다른 테스트가 내 테스트를 방해해요"

`PersonalStatsRefreshSagaUnitTest`에서 더 교묘한 문제를 만났다. 테스트는 때로는 성공하고, 때로는 실패했다. 원인은 클래스 레벨에서 선언된 Mock 객체를 여러 `then` 블록이 공유하면서 발생한 '테스트 간섭'이었다.

```
// ❌ 문제가 발생했던 Mock 공유 코드
class PersonalStatsRefreshSagaUnitTest : BehaviorSpec({
    // 😱 클래스 레벨에서 Mock 객체 선언 (모든 then 블록이 이 인스턴스를 공유)
    val userRepository: UserRepository = mockk()
    val analysisService: AnalysisService = mockk()
    // ...

    given("사용자가 존재하지 않을 때") {
        then("보상 트랜잭션이 실행되어야 한다") {
            every { userRepository.findAllActiveUserIds() } returns emptyList()
            every { analysisService.deletePersonalAnalysis(any()) } just Runs
            // ...
            verify(exactly = 1) { analysisService.deletePersonalAnalysis(any()) } // 여기선 성공
        }
    }

    given("정상 사용자의 경우") {
        then("성공적으로 완료되어야 한다") {
            every { userRepository.findAllActiveUserIds() } returns listOf("test-user")
            // ...
            // 💥 실패! 이전 테스트에서 deletePersonalAnalysis가 호출된 기록이 남아있음!
            verify(exactly = 0) { analysisService.deletePersonalAnalysis(any()) }
        }
    }
})
```

then 블록들은 독립적으로 실행되지만, 클래스 레벨의 `mockk()` 인스턴스는 상태(호출 기록 등)를 공유했다. 따라서 첫 번째 테스트에서 `analysisService.deletePersonalAnalysis()`가 호출된 기록이 남아, 두 번째 테스트의 `verify(exactly = 0)` 검증을 실패하게 만들었던 것이다.

이 문제 역시 `then` 블록 내에서 Mock 객체를 생성하여 해결했다.

```kotlin
// ✅ Mock 격리 문제를 해결한 코드
class PersonalStatsRefreshSagaUnitTest : BehaviorSpec({
    given("사용자가 존재하지 않을 때") {
        then("보상 트랜잭션이 실행되어야 한다") {
            // then 블록 내에서 독립적인 Mock 인스턴스 생성
            val analysisService = mockk<AnalysisService>()
            // ...
            every { analysisService.deletePersonalAnalysis(any()) } just Runs
            // ...
            verify(exactly = 1) { analysisService.deletePersonalAnalysis(any()) }
        }
    }

    given("정상 사용자의 경우") {
        then("성공적으로 완료되어야 한다") {
            // 이 테스트만을 위한 새로운 Mock 인스턴스 생성
            val analysisService = mockk<AnalysisService>()
            // ...
            // ✅ 성공! 이 Mock 인스턴스에는 deletePersonalAnalysis 호출 기록이 없음
            verify(exactly = 0) { analysisService.deletePersonalAnalysis(any()) }
        }
    }
})
````

**교훈: 테스트의 독립성과 신뢰성을 보장하려면, Mock 객체는 반드시 각 `then` 블록 내부에서 생성하고 설정해야 했다.**

## 📈 테스트를 넘어 품질 측정으로: JaCoCo 도입기

TDD를 통해 많은 테스트를 작성했지만, 이것이 정말로 중요한 로직을 충분히 커버하고 있는지 확신하기 어려웠다. 그래서 나는 코드 커버리지 측정 도구인 `JaCoCo`를 도입하고, 프로젝트의 품질 목표를 설정했다.

`build.gradle.kts`에 다음과 같이 품질 게이트(Quality Gate)를 설정했다.

```
// build.gradle.kts
tasks.jacocoTestCoverageVerification {
    violationRules {
        rule {
            limit {
                counter = "BRANCH"
                value = "COVEREDRATIO"
                minimum = "0.75".toBigDecimal() // 분기문 커버리지 최소 75%
            }
        }
        rule {
            limit {
                counter = "LINE"
                value = "COVEREDRATIO"
                minimum = "0.80".toBigDecimal() // 라인 커버리지 최소 80%
            }
        }
    }
}
```

- **Branch Coverage (분기 커버리지) 75%**: `if`, `when` 등 모든 조건 분기문의 참/거짓 경로를 최소 75% 이상 테스트해야 한다는 의미다. 이는 단순히 코드를 실행하는 것을 넘어, 로직의 모든 경우의 수를 테스트하도록 강제했다.
    
- **Line Coverage (라인 커버리지) 80%**: 전체 코드 중 최소 80%의 라인이 테스트에 의해 한 번 이상 실행되어야 한다는 의미였다.
    

이 목표를 설정하자 기존의 테스트 코드는 충분하지 않다는것을 바로 파악할 수 있었고, 더 견고한 검증 체계를 구축하는 기반이 되었다. `생각보다 너무 낮아서 충격이였다..`

## 마치며

TDD는 단순히 테스트 코드를 먼저 작성하는 행위가 아니라, 소프트웨어 설계와 품질에 대한 깊은 고민이 담긴 문화라고 느꼈다. 이번 계기로 '좋은 실패'를 정의하고, Kotest의 특성을 깊이 이해하며, JaCoCo로 품질을 측정하는 과정을 통해 더 견고하고 신뢰성 있는 소프트웨어를 만들어가는 방법을 배웠다고 생각한다.



## 참고자료

- [Martin Fowler - Test Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html "null")
- [Kotest Framework Documentation](https://kotest.io/docs/framework/framework.html "null")
- [Baeldung - Introduction to JaCoCo](https://www.baeldung.com/jacoco "null")
- [우아한형제들 기술 블로그 - 테스트 커버리지 100%?](https://techblog.woowahan.com/2604/ "null")![]
