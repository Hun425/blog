---
title: "함수형 프로그래밍이란 무엇일까"
description: "목디스크랑 대상포진은 조금 힘드네..?"
date: 2025-09-09
category: cs
tags: ["Java", "kotlin"]
cover: ./cover.jpeg
velogUrl: https://velog.io/@chae0738/%ED%95%A8%EC%88%98%ED%98%95-%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%EC%9D%B4%EB%9E%80-%EB%AC%B4%EC%97%87%EC%9D%BC%EA%B9%8C
---

## 들어가며
회사에서의 첫번째 프로젝트가 끝나면서 받은 스트레스와 피로가 한번에 몰려온 것인지, 9월 첫째주에 들어가며 갑자기 목디스크와 대상포진이 같이 찾아왔다. 그래서 내 피같은 휴가를 3일이나 쓰면서 병원을 다녔고, 블로그도 쓰지 못했던거 같다. `매일 약먹고 잠만잤다..` 
특히나 정말 가고싶은 곳의 면접 일정까지 있어서 약먹고 어떻게든 참석했지만 평소보다 많이 준비하지 못했고, 내 자신을 잘 어필하지 못했다고 느꼈다. 사실 결국은 핑계고 지나간 기회보다는 앞으로 다가올 기회를 잡기 위해 요즘들어 공부한 내용을 정리해보고자 한다.


## 1. 함수형 프로그래밍에 대해 아는 대로 설명해보세요.

예전 면접에서 받았던 질문이었다. 나는 순간 머리가 하얘졌다. 

"명령형이 아닌 선언형이고.. 1급 객체 정도만 들어봤습니다." 

스스로도 만족스럽지 못한, 겉핥기식 답변을 내뱉었다.
평소에 자바를 이용한 OOP만 많이 활용했기 때문에 함수형에 대해 지식이 전무 한 것도 한목했다. 

집에 와서 복기를 해보면서 마침 최근 공부하는 코틀린의 장점이 `OOP + 함수형` 이였다는걸 기억해 내었고 내가 부족했던 지식과 궁금증을 채우기 위해 공부를 시작했다. 


## 2. 함수형 프로그래밍?

먼저 내가 내린 결론은 이렇다. 함수형 프로그래밍은 **'어떻게' 할지를 일일이 명령하는 것에서 벗어나, '무엇을' 원하는지 선언하는 방식으로 사고를 전환하는 것**이다. 

이 거대한 전환을 가능하게 하는 몇 가지 핵심적인 개념들이 있었다.

### 가. 순수 함수 (Pure Functions)

함수형 프로그래밍의 심장은 바로 순수 함수다. 어떤 함수가 '순수하다'는 것은 두 가지 약속을 지킨다는 뜻이다.

1. **같은 입력에는 항상 같은 출력을 반환한다**: 함수는 전달된 인자에만 의존할 뿐, 전역 변수나 데이터베이스 상태 같은 외부 세상에 영향을 받지 않는다. 수학 함수 f(x) = 2x처럼, x에 2를 넣으면 언제 어디서 호출하든 결과는 항상 4인 것과 같다.

2. **부수 효과(Side Effect)가 없다**: 함수가 실행되면서 외부 세상에 어떤 변화도 일으키지 않는다. 전역 변수를 수정하거나, 인자로 받은 객체의 값을 바꾸는 등의 '몰래 하는 딴짓'이 없다.

이 두 가지 약속 덕분에 코드는 예측 가능해지고, 테스트하기 쉬워진다.

### 나. 불변성 (Immutability)

**"한 번 만들어진 데이터는 변하지 않는다."** 이것이 불변성의 원칙이다. 

만약 데이터를 바꿔야 한다면, 원본을 수정하는 대신 변경된 내용으로 새로운 복사본을 만드는 것이다. `Java 17 의 record 처럼?`

이는 마치 수정 이력을 남기는 것과 같다. 원본 데이터는 그대로 있으니 "이 데이터가 중간에 누가 바꿨지?"와 같은 종류의 버그를 원천적으로 차단할 수 있다. 특히 여러 스레드가 동시에 데이터에 접근하는 멀티스레딩 환경에서 불변성은 복잡한 동기화 문제 없이 안전하게 데이터를 공유할 수 있는 강력한 장점이다.

### 다. 1급 객체 함수와 고차 함수

함수형 언어에서는 함수가 `Int`나 `String` 같은 일반 값처럼 취급되는 **'1급 객체'**다. 변수에 담을 수도, 다른 함수의 인자로 넘길 수도, 함수의 결과로 반환될 수도 있다.

그리고 이 특성을 활용하는 것이 바로 **고차 함수(Higher-Order Function)**다. 우리가 흔히 쓰는 `map`, `filter`, `reduce`는 모두 함수를 인자로 받는 고차 함수다. 

이는 '동작' 자체를 부품처럼 만들어두고, 필요할 때마다 조합해서 더 큰 기능을 만들어내는 것을 가능하게 했다. 
` 마치 전략 패턴을 보는것 같았다`

## 3. 내 코드를 함수형으로 바꿔보기

개념은 이제 알겠다. 그렇다면 실제 코드에서는 어떤 차이가 있을까? 

마침 예전에 진행했던 CS-Quiz 프로젝트의 Java 코드가 좋은 예시가 될 것 같았다. 명령형 스타일로 작성된 부분을 함수형 스타일로 리팩토링하며 그 차이를 직접 비교해 봤다.

### 예제 1: 문제별 통계 계산 로직 개선

`QuizServiceImpl.java`에는 퀴즈의 문제별 통계를 계산하는 메소드가 있었다. 기존 코드는 `HashMap`을 만들고, `forEach` 루프를 돌며 외부의 `Map` 상태를 계속 변경하는 전형적인 명령형 방식이었다.

#### [원본 코드]

```java
private Map<Long, QuestionStatistics> calculateQuestionStatistics(Quiz quiz, List<QuizAttempt> attempts) {
    Map<Long, QuestionStatistics> stats = new HashMap<>();

    // 1. 외부 Map을 생성하고
    quiz.getQuestions().forEach(question -> {
        // 2. 루프를 돌며 초기화
        stats.put(question.getId(), new QuestionStatistics(question.getId()));
    });

    // 3. 다시 루프를 돌며 외부 Map의 상태를 직접 변경
    attempts.forEach(attempt -> {
        attempt.getQuestionAttempts().forEach(questionAttempt -> {
            QuestionStatistics questionStat = stats.get(questionAttempt.getQuestion().getId());
            if (questionStat != null) {
                questionStat.updateStatistics(questionAttempt);
            }
        });
    });

    return stats;
}
```

#### [함수형 리팩토링]

```java
private Map<Long, QuestionStatistics> calculateQuestionStatistics(Quiz quiz, List<QuizAttempt> attempts) {
    // 데이터가 어떻게 흘러가는지를 선언
    return attempts.stream() // 시도 목록을 스트림으로 만들고
            .flatMap(attempt -> attempt.getQuestionAttempts().stream()) // 모든 문제 시도로 평탄화한 뒤
            .collect(Collectors.groupingBy( // 문제 ID를 기준으로 그룹핑하여
                    qa -> qa.getQuestion().getId(),
                    Collectors.collectingAndThen( // 각 그룹을 QuestionStatistics 객체로 변환한다
                            Collectors.toList(),
                            questionAttempts -> {
                                Long questionId = questionAttempts.getFirst().getQuestion().getId();
                                QuestionStatistics stats = new QuestionStatistics(questionId);
                                questionAttempts.forEach(stats::updateStatistics);
                                return stats;
                            }
                    )
            ));
}
```

#### 무엇이 좋아졌나?

- 코드가 "어떻게 통계를 낼지"를 지시하는 대신, **"데이터를 어떤 흐름으로 변환하여 원하는 결과를 만들지"**를 선언하고 있었다
- `flatMap`으로 중첩된 데이터를 펼치고, `groupingBy`로 그룹화한 뒤, 각 그룹을 최종 결과물로 변환하는 파이프라인이 한눈에 보였다
- 외부 상태를 변경하는 대신, 마지막에 최종 결과물을 한 번에 만들어내므로 훨씬 안정적이었다

### 예제 2: 태그별 성과 분석 로직 집계

사용자의 태그별 평균 점수를 계산하는 로직도 있었다. 원본 코드는 중간 데이터를 저장할 `Map`을 만들고, `for` 루프를 돌며 값을 채운 뒤, 다시 `forEach`로 평균을 계산하는 다소 번거로운 과정이었다.

#### [원본 코드]

```java
private Map<Tag, Double> analyzeTagPerformance(List<QuizAttempt> attempts) {
    Map<Tag, List<Integer>> tagScores = new HashMap<>();

    // 1. 중간 데이터를 저장할 Map을 만들고
    for (QuizAttempt attempt : attempts) {
        int score = attempt.getScore();
        // 2. 루프를 돌며 값을 채운다
        attempt.getQuiz().getTags().forEach(tag -> {
            tagScores.computeIfAbsent(tag, k -> new ArrayList<>()).add(score);
        });
    }
    
    Map<Tag, Double> tagPerformance = new HashMap<>();
    // 3. 다시 루프를 돌며 평균을 계산하고 새로운 Map에 담는다
    tagScores.forEach((tag, scores) -> {
        double avgScore = scores.stream().mapToInt(Integer::intValue).average().orElse(0);
        tagPerformance.put(tag, avgScore);
    });

    return tagPerformance;
}
```

#### [함수형 리팩토링]

```java
private Map<Tag, Double> analyzeTagPerformance(List<QuizAttempt> attempts) {
    return attempts.stream()
            // 1. 각 시도를 (태그, 점수) 쌍의 스트림으로 펼치고
            .flatMap(attempt -> attempt.getQuiz().getTags().stream()
                    .map(tag -> new AbstractMap.SimpleEntry<>(tag, attempt.getScore()))
            )
            // 2. 태그로 그룹핑하며, 동시에 값들의 평균을 계산한다
            .collect(Collectors.groupingBy(
                    Map.Entry::getKey,
                    Collectors.averagingDouble(Map.Entry::getValue)
            ));
}
```

#### 무엇이 좋아졌나?

- 두 개의 `Map`과 여러 개의 루프가 단 하나의 스트림 파이프라인으로 정리됐다
- `Collectors.groupingBy`와 `Collectors.averagingDouble`의 조합은 "태그로 묶어서 점수 평균 내줘"라는 요구사항을 코드로 그대로 번역한 것처럼 보였다
- 중간 과정에서 불필요한 컬렉션을 만들지 않아 메모리 효율도 더 좋았다

## 4. 글을 마치며

함수형 프로그래밍을 공부하고 실제 코드에 적용해보니, 왜 많은 SI에서 금지 하는지 알 거 같았다. 공부하면 할 수록 가독성이 높아지는 장점이 보이지만 결국 공부하지 않은 사람은 알아먹기가 너무 힘들기 때문이다. `ㅜㅜ` 

물론 모든 것을 함수형으로 작성하면 좋은 것은 아닌 것 같다. 객체 지향이 애플리케이션의 구조를 잡는 데 유리한 것처럼, 함수형은 데이터를 다루고 변환하는 로직을 명확하게 만드는 데 강점이 있다. 현대적인 개발은 이 둘의 장점을 모두 취하는 방향으로 나아가고 있다고 생각한다. `kotlin 처럼?`

면접에서의 그 질문은 나에게 뼈아픈 자극이었지만, 덕분에 개발자로서 한 단계 성장하는 계기가 되었다.이런 고찰과 학습을 할 수 있는 회사에서 근무하면 좋겠지만.. 준비하고 있으면 언젠가는 기회가 올 거라고 생각하며 글을 마친다.

## 참고자료


- [Oracle Java Tutorials - Lambda Expressions](https://docs.oracle.com/javase/tutorial/java/javaOO/lambdaexpressions.html)
- [Oracle Java Tutorials - Aggregate Operations](https://docs.oracle.com/javase/tutorial/collections/streams/index.html)
- [Oracle Java SE 8: New and Enhanced APIs](https://docs.oracle.com/javase/8/docs/technotes/guides/language/lambda_api_jdk8.html)
- [Top 5 Functional Programming Languages in 2025 - Coursera](https://www.coursera.org/articles/functional-programming-languages) 
- [Functional Programming Languages Guide 2025 - Flatirons](https://flatirons.com/blog/functional-programming-languages/)
