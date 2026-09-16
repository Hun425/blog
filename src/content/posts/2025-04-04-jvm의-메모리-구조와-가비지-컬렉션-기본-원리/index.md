---
title: "JVM의 메모리 구조와 가비지 컬렉션 기본 원리"
description: "몸살도 내 공부를 막을순 없다."
date: 2025-04-04
category: cs
tags: ["JVM", "가비지컬렉션", "메모리구조"]
cover: ./cover.png
velogUrl: https://velog.io/@chae0738/JVM%EC%9D%98-%EB%A9%94%EB%AA%A8%EB%A6%AC-%EA%B5%AC%EC%A1%B0%EC%99%80-%EA%B0%80%EB%B9%84%EC%A7%80-%EC%BB%AC%EB%A0%89%EC%85%98-%EA%B8%B0%EB%B3%B8-%EC%9B%90%EB%A6%AC
---

최근 너무 열정적으로 달려서 그런지 갑자기 몸살감기가 찾아왔다...
이 고통을 빨리(?) 잊기위해서 못했던 공부를 추가로 하기로 했다.

[지난 글](https://velog.io/@chae0738/만일-스택이-매우-커질-수-있다면-힙은-불필요할까)에서 스택과 힙의 근본적인 차이와 메모리 파편화 문제에 대해 다뤘다. 이번에는 저번에 생긴 의문을 바탕으로 Java 가상 머신(JVM)의 메모리 구조와 가비지 컬렉션 메커니즘에 대해 자세히 살펴보고자 한다. JVM은 자바 프로그램이 실행되는 가상 환경으로, 메모리 관리를 효율적으로 수행하기 위한 복잡한 구조를 가지고 있다.

## JVM의 메모리 구조

JVM의 메모리는 크게 다음과 같은 영역으로 나뉜다.

1. **메서드 영역(Method Area)**: 클래스 구조, 메서드 데이터, 상수, 정적 변수 등이 저장되는 영역.
2. **힙 영역(Heap Area)**: 객체 인스턴스와 배열이 저장되는 영역으로, 가비지 컬렉션의 주요 대상.
3. **스택 영역(Stack Area)**: 메서드 호출 시 생성되는 프레임을 저장하는 영역으로, 지역 변수, 연산 중간 결과 등이 저장된다.
4. **PC 레지스터(Program Counter Register)**: 현재 실행 중인 JVM 명령의 주소를 저장한다.
5. **네이티브 메서드 스택(Native Method Stack)**: 네이티브 코드를 위한 스택 영역.

이 중에서 힙 영역은 가장 복잡하고 중요한 영역으로, 객체의 생성과 소멸이 끊임없이 일어나는 공간이다. 힙 메모리는 효율적인 관리를 위해 여러 세대(Generation)로 나뉜다.

## 힙 메모리의 세대별 구조

JVM의 힙 메모리는 크게 Young Generation(젊은 세대)과 Old Generation(오래된 세대)으로 나뉜다.

### 1. Young Generation

새롭게 생성된 객체들이 처음 할당되는 영역으로, 다시 세 부분으로 나뉜다.

- **Eden Space**: 새로운 객체가 최초로 할당되는 공간.
- **Survivor Space 0 (S0)**: Minor GC 후 살아남은 객체들이 Eden에서 이동하는 첫 번째 공간.
- **Survivor Space 1 (S1)**: S0와 함께 번갈아가며 살아남은 객체를 보관하는 공간.

대부분의 객체는 생성 후 얼마 지나지 않아 더 이상 사용되지 않게 된다. 이를 `약한 세대 가설(Weak Generational Hypothesis)`이라고 부른다. JVM은 이 특성을 활용해 Young Generation에서 자주 GC를 수행하여 짧은 수명의 객체들을 빠르게 제거한다.

### 2. Old Generation (Tenured)

여러 번의 Minor GC 이후에도 살아남은 객체들은 Old Generation으로 이동한다. 이 영역은 Young Generation보다 크고, GC 주기도 더 길다.

### 3. Metaspace (Java 8부터)

Java 8 이전의 PermGen(Permanent Generation) 대신 도입된 영역이다. 클래스 메타데이터를 저장하며, 네이티브 메모리를 사용한다.

## 가비지 컬렉션 동작 원리

JVM의 가비지 컬렉션은 크게 두 종류로 나뉜다.

### 1. Minor GC

Young Generation에서 발생하는 가비지 컬렉션으로, 다음과 같은 과정을 거친다.

1. 새로운 객체는 Eden Space에 할당된다.
2. Eden Space가 가득 차면 Minor GC가 발생한다.
3. 참조되지 않는 객체는 즉시 제거된다.
4. 살아남은 객체는 Survivor Space(S0 또는 S1)로 이동한다.
5. 이전 Survivor Space에 있던 객체 중 살아남은 것도 다른 Survivor Space로 이동한다.
6. 이 과정에서 Survivor Space 간의 이동이 반복될 때마다 객체의 나이(Age)가 증가한다.
7. 특정 나이(기본값은 15)에 도달한 객체는 Old Generation으로 이동한다(이를 'Promotion'이라 한다).

Minor GC는 빠르게 수행되며, 애플리케이션 실행을 잠시 중단시키는 Stop-the-World 현상이 발생하지만, 그 시간이 매우 짧다.

### 2. Major GC (Full GC)

Old Generation에서 발생하는 가비지 컬렉션으로, 다음 상황에서 발생한다:

1. Old Generation이 가득 찼을 때
2. 메타스페이스가 가득 찼을 때
3. 명시적으로 System.gc()를 호출했을 때 (권장되지 않음)

Major GC는 전체 힙을 대상으로 하므로 시간이 오래 걸리며, 애플리케이션을 완전히 중단시키는 Stop-the-World 현상이 발생한다.

## 가비지 컬렉션 알고리즘

JVM에서 사용되는 주요 가비지 컬렉션 알고리즘은 다음과 같다.

### 1. Mark-Sweep-Compact

가장 기본적인 GC 알고리즘으로, 세 단계로 구성된다.

- **Mark(표시)**: 접근 가능한 모든 객체를 식별하고 표시한다.
- **Sweep(제거)**: 표시되지 않은 객체를 제거한다.
- **Compact(압축)**: 남은 객체들을 힙의 한쪽 끝으로 이동시켜 파편화를 제거한다.

```java
// Mark-Sweep-Compact 과정의 의사 코드
void markSweepCompact() {
    // 1. Mark 단계: GC Root에서 접근 가능한 모든 객체 식별
    for (Object obj : gcRoots) {
        markAsReachable(obj);
    }
    
    // 2. Sweep 단계: 접근 불가능한 객체 제거
    for (Object obj : heapObjects) {
        if (!isMarked(obj)) {
            free(obj);
        }
    }
    
    // 3. Compact 단계: 남은 객체들을 한쪽으로 모음
    Address destination = heapStart;
    for (Object obj : heapObjects) {
        if (isMarked(obj)) {
            move(obj, destination);
            destination += getSize(obj);
            unmark(obj);
        }
    }
}
```

이 알고리즘은 메모리 파편화 문제를 효과적으로 해결하지만, 애플리케이션 실행을 일시 중단시키는 단점이 있다.

### 2. Copying 알고리즘

Young Generation의 Minor GC에서 주로 사용되는 알고리즘으로, 메모리를 두 영역으로 나누고, 살아있는 객체만 다른 영역으로 복사한다. 원래 영역은 완전히 비워진다.

```java
// Copying 알고리즘의 의사 코드
void copyingSurvivors(Space from, Space to) {
    // from 영역에서 살아있는 객체를 식별
    for (Object obj : gcRoots) {
        markLiveObjects(obj, from);
    }
    
    // 살아있는 객체를 to 영역으로 복사
    for (Object obj : from) {
        if (isMarked(obj)) {
            Address newLocation = copyTo(obj, to);
            updateReferences(obj, newLocation);
            incrementAge(obj);
        }
    }
    
    // from 영역을 완전히 비움
    clearSpace(from);
}
```

이 알고리즘은 파편화 없이 빠르게 메모리를 회수할 수 있지만, 메모리의 절반만 사용할 수 있다는 단점이 있다.

### 3. Generational 알고리즘

앞서 설명한 세대별 가비지 컬렉션이 바로 이 알고리즘이다. 객체의 수명에 따라 메모리를 여러 세대로 나누고, 각 세대에 적합한 알고리즘을 적용한다.

- Young Generation: Copying 알고리즘
- Old Generation: Mark-Sweep-Compact 알고리즘

이 알고리즘은 대부분의 객체가 짧은 수명을 가진다는 특성을 이용해 전체적인 GC 성능을 향상시킨다.

## JVM의 메모리 파편화 해결 방법

JVM은 메모리 파편화 문제를 주로 다음과 같은 방법으로 해결한다.

### 1. 압축 (Compaction)

Mark-Sweep-Compact 알고리즘의 마지막 단계인 압축을 통해 남은 객체들을 연속된 공간으로 모은다. 이는 외부 파편화 문제를 해결하는 가장 직접적인 방법이다.

```java
// 압축 과정의 의사 코드
void compact() {
    Address freePointer = heapStart;
    
    // 살아있는 객체만 연속적으로 재배치
    for (Object obj : heapObjects) {
        if (isMarked(obj)) {
            if (getAddress(obj) != freePointer) {
                moveObject(obj, freePointer);
                updateReferences(obj, freePointer);
            }
            freePointer += getSize(obj);
        }
    }
    
    // freePointer 이후의 공간은 모두 비어있음
    markAsFree(freePointer, heapEnd - freePointer);
}
```

### 2. 세대별 관리를 통한 효율적인 메모리 재사용

Young Generation에서는 Copying 알고리즘을 사용하여 파편화를 방지한다. 대부분의 객체가 Young Generation에서 제거되므로, 전체적인 메모리 효율성이 높아진다.

### 3. 크기별 객체 풀링

일부 JVM 구현체는 자주 사용되는 특정 크기의 객체들을 위한 풀(Pool)을 유지한다. 이는 내부 파편화를 줄이고, 메모리 할당/해제 시간을 단축시킨다.

## JVM 메모리 관리 최적화 기법

효율적인 JVM 메모리 관리를 위한 몇 가지 기법을 살펴보자:

### 1. 힙 크기 튜닝

JVM의 힙 크기는 `-Xms`(초기 힙 크기)와 `-Xmx`(최대 힙 크기) 옵션으로 조절할 수 있다. 적절한 힙 크기 설정은 애플리케이션 성능에 큰 영향을 미친다.

```bash
java -Xms1G -Xmx2G MyApplication
```

위 명령은 최소 1GB, 최대 2GB의 힙 메모리를 사용하도록 JVM을 설정한다.

### 2. 세대 비율 조정

Young Generation과 Old Generation의 비율을 조정하여 GC 성능을 최적화할 수 있다. `-XX:NewRatio` 옵션을 사용한다.

```bash
java -XX:NewRatio=2 MyApplication
```

위 명령은 Old:Young = 2:1 비율로 설정한다(전체 힙의 1/3이 Young Generation).

### 3. 객체 생존 나이 임계값 조정

Young Generation에서 Old Generation으로 이동하는 객체의 나이 임계값을 `-XX:MaxTenuringThreshold` 옵션으로 조정할 수 있다.

```bash
java -XX:MaxTenuringThreshold=10 MyApplication
```

### 4. GC 알고리즘 선택

JVM은 다양한 GC 알고리즘을 제공하며, 애플리케이션 특성에 맞게 선택할 수 있다.

- **Serial GC**: `-XX:+UseSerialGC`
- **Parallel GC**: `-XX:+UseParallelGC`
- **CMS(Concurrent Mark Sweep)**: `-XX:+UseConcMarkSweepGC`
- **G1(Garbage First)**: `-XX:+UseG1GC`

각 알고리즘은 메모리 사용량, 일시 중단 시간, CPU 사용량 등에서 서로 다른 특성을 보인다.

## 실제 코드로 보는 JVM 메모리 동작

다음은 JVM 메모리 할당과 가비지 컬렉션을 보여주는 간단한 예제다.

```java
public class MemoryExample {
    public static void main(String[] args) {
        // 1. Young Generation에 할당
        for (int i = 0; i < 100000; i++) {
            allocateObject();
        }
        
        System.out.println("첫 번째 할당 완료");
        
        // 2. 두 번째 할당 - Minor GC 발생 가능
        for (int i = 0; i < 100000; i++) {
            allocateObject();
        }
        
        System.out.println("두 번째 할당 완료");
        
        // 3. Old Generation으로 넘어갈 수 있는 객체 생성
        List<Object> longLived = new ArrayList<>();
        for (int i = 0; i < 10000; i++) {
            longLived.add(new byte[1024]); // 1KB 객체
        }
        
        System.out.println("장수명 객체 할당 완료");
        
        // 4. Minor GC를 유발하는 추가 할당
        for (int i = 0; i < 100000; i++) {
            allocateObject();
        }
        
        System.out.println("프로그램 종료");
    }
    
    private static void allocateObject() {
        // 짧은 수명의 작은 객체 할당
        byte[] bytes = new byte[1024]; // 1KB
    }
}
```

이 코드를 다음 옵션으로 실행하면 GC 활동을 로그로 확인할 수 있다.

```bash
java -Xms10M -Xmx10M -XX:+PrintGCDetails MemoryExample
```

위 예제에서 `allocateObject()` 메서드로 생성된 대부분의 객체는 Young Generation의 Eden 영역에 할당되며, 참조가 사라지면 다음 Minor GC에서 제거된다. 반면 `longLived` 리스트에 저장된 객체들은 여러 GC 이후에도 살아남아 Old Generation으로 이동할 가능성이 높다.

## JVM 모니터링 및 분석 도구

JVM 메모리를 모니터링하고 분석하기 위한 다양한 도구가 있다.

1. **jstat**: JVM 통계 모니터링 도구
2. **jmap**: 힙 덤프 생성 도구
3. **jconsole**: JVM 모니터링 GUI 도구
4. **VisualVM**: 메모리 및 CPU 프로파일링 도구
5. **Java Mission Control**: 고급 JVM 모니터링 및 분석 도구

이런 도구들을 활용하면 메모리 누수, GC 병목 현상 등의 문제를 파악하고 해결할 수 있다.

## 결론 & 고찰

JVM의 메모리 구조와 가비지 컬렉션 메커니즘은 자바 애플리케이션의 성능과 안정성에 직접적인 영향을 미친다. 세대별 가비지 컬렉션, Mark-Sweep-Compact 알고리즘, Copying 알고리즘 등의 기법을 통해 JVM은 메모리 파편화 문제를 효과적으로 해결하면서도 높은 성능을 유지한다.

**하지만!!**
결국은 이런 방식들을 사용하면 Stop-the-World 현상 `프로세스 정지`를 아예 막을 수는 없다. 근데 우리는 프로그램을 사용하는데 그러한 정지 현상을 느끼지 못하는게 대부분이다. 여기서 어떤 방식을 사용해서 최적화를 했길래 우리가 못느낄정도로 빠르게 돌아가는지 궁금해졌다.

## 다음 글 예고
[다음 글](https://velog.io/@chae0738/%EB%A9%94%EB%AA%A8%EB%A6%AC-%EA%B4%80%EB%A6%AC-%EC%B5%9C%EC%A0%81%ED%99%94-%EA%B8%B0%EB%B2%95-%EC%95%8C%EC%95%84%EB%B3%B4%EA%B8%B0)에서는 고성능 애플리케이션, 특히 게임 서버나 금융 시스템과 같이 낮은 지연 시간과 높은 처리량이 요구되는 시스템에서의 메모리 관리 최적화 기법에 대해 살펴볼 것이다. 커스텀 메모리 풀 구현, 오프힙 메모리 활용, 메모리 프리 할당 전략 등 실전에서 사용되는 다양한 기법들을 코드 예제와 함께 소개할 예정이다.



## 참고자료
1. [Java Virtual Machine Specification](https://docs.oracle.com/javase/specs/jvms/se8/html/index.html)
2. [Understanding JVM Internals](http://blog.jamesdbloom.com/JVMInternals.html)
3. [Java Garbage Collection Tuning Guide](https://sematext.com/java-garbage-collection-tuning/)
4. [Best Practices for JVM Memory Issues](https://www.ibm.com/docs/en/baw/24.x?topic=issues-best-practices-jvm-memory)
5. [Java Performance: The Definitive Guide](https://m.hanbit.co.kr/store/books/book_view.html?p_code=E4867731762)
