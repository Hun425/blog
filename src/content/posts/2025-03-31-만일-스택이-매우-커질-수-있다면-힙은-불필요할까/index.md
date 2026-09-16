---
title: "스택이 매우 커질 수 있다면 힙은 불필요할까"
description: "잠을 깨게 해준 유튜브 한편"
date: 2025-03-31
category: cs
tags: ["heap", "stack", "자료구조"]
cover: ./cover.webp
velogUrl: https://velog.io/@chae0738/%EB%A7%8C%EC%9D%BC-%EC%8A%A4%ED%83%9D%EC%9D%B4-%EB%A7%A4%EC%9A%B0-%EC%BB%A4%EC%A7%88-%EC%88%98-%EC%9E%88%EB%8B%A4%EB%A9%B4-%ED%9E%99%EC%9D%80-%EB%B6%88%ED%95%84%EC%9A%94%ED%95%A0%EA%B9%8C
---

## 재밌는 유튜브 발견✨ 

최근에 지하철을 타면 피곤해서 잠만자던도중...
잠을 깨기위해 볼 유튜브를 찾다가 궁금하게 만드는 제목을 발견했다. 
**만일 스택이 매우 커질 수 있다면 힙은 불필요할까?** [유튜브 링크](https://www.youtube.com/watch?v=9TSojdIr8Q0&t=93s&ab_channel=%EB%84%90%EB%84%90%ED%95%9C%EA%B0%9C%EB%B0%9C%EC%9E%90TV) 
이 제목이 나를 영상으로 이끌었고, 덕분에 지하철의 30분이 시간가는 줄 몰랐다.... 단순한 질문에 대한 답변 뿐만아니라, 어떤걸 묻는지에 대한 분석과 꼬리에 꼬리를 무는 답변까지 보면 30분이 순삭되는 영상이므로 한번씩 보는걸 추천한다.
`댓글도 개발자들의 다양한 시각을 볼 수 있어서 재밌다`

이 영상을 보고 배운점들을 정리하고, 궁금한점이 더 생겼기 때문에 블로그 글을 통해 정리하고자 한다.

먼저 이 질문에 답하기 위해서는 먼저 스택과 힙의 근본적인 차이를 이해해야 한다. 스택은 LIFO(Last-In-First-Out) 구조로 정적이고 자동적인 메모리 할당 방식을 사용한다. 반면 힙은 동적으로 메모리를 할당하고 임의의 순서로 해제할 수 있는 유연성을 제공한다.

## 스택과 힙의 특성

### **스택**

- **LIFO 구조**: 가장 최근에 할당된 메모리가 가장 먼저 해제된다.
    
- **정적/자동 메모리 할당**: 컴파일 시점에 크기가 결정되거나 함수 호출 시 자동으로 할당되고 반환된다.
    
- **연속적 메모리 할당**: 메모리가 연속적으로 할당되어 파편화가 적다.
    
- **빠른 접근 속도**: 포인터 연산만으로 빠르게 데이터에 접근할 수 있다.
    
- **수명 제한**: 함수 호출 범위 내에서만 데이터가 유지된다.
    

### **힙**

- **동적 메모리 할당**: 프로그램 실행 중에 필요에 따라 메모리를 할당하고 해제할 수 있다.
    
- **불규칙한 할당/해제**: 메모리 할당과 해제가 임의의 순서로 이루어질 수 있다.
    
- **수명 관리의 유연성**: 객체의 수명이 생성 스코프를 벗어나 존재할 수 있다.
    
- **비연속적 메모리 할당**: 메모리가 비연속적으로 할당될 수 있다.
    
- **멀티스레드 환경에서 공유 가능**: 스레드 간 데이터 공유가 가능하다.
    

## 힙이 필요한 이유

결론적으로, 스택의 크기가 무한히 커진다 하더라도 힙은 여전히 필요하다. 그 이유는 다음과 같다.

1. **데이터 수명 관리**  
    스택은 함수 호출 범위로 데이터 수명이 제한되지만, 힙은 객체의 수명을 더 유연하게 관리할 수 있다.
    
2. **동적 크기의 데이터 구조**  
    사용자 입력에 따라 크기가 결정되는 배열과 같은 구조는 스택에 적합하지 않다.
    
3. **멀티스레드 환경**  
    스레드 간 데이터 공유에는 힙이 필요하다. (스택은 스레드끼리 공유안함)
    
4. **객체 지향 프로그래밍**  
    객체의 동적 생성과 공유는 힙 없이는 어렵다.
    

## 코드 예제: 스택과 힙

다음 간단한 예제는 스택과 힙의 사용 차이를 보여준다:

```java
void stackExample() {     
    int stackVar = 42;  // 스택에 할당         
    // 함수 종료 시 stackVar은 자동으로 해제됨 
} 

void heapExample() {     
    Integer* heapVar = new Integer(42);  // 힙에 할당         
    // 명시적으로 해제하지 않으면 메모리 누수 발생    
    delete heapVar; 
}
```

## 힙 메모리의 파편화 문제

스택과 힙에 대한 이해가 깊어지면서 자연스럽게 힙 메모리의 파편화 문제에 대해 생각하게 되었다. 힙 메모리 파편화는 메모리 할당과 해제의 반복 과정에서 발생하는 현상으로, 크게 두 가지 유형이 있다:

### 1. 외부 파편화(External Fragmentation)

여러 개의 작은 메모리 블록들이 할당된 메모리 사이에 흩어져 있어, 개별적으로는 작지만 합치면 큰 메모리 블록을 할당할 수 있는 상황이다.

예를 들어:

```
[ 사용 중 10KB ][ 빈 5KB ][ 사용 중 20KB ][ 빈 10KB ][ 사용 중 15KB ][ 빈 15KB ]
```

이 상태에서 25KB 메모리 할당을 요청하면, 총 30KB의 빈 공간이 있음에도 불구하고 할당할 수 없다.

### 2. 내부 파편화(Internal Fragmentation)

할당된 메모리 블록 내부에서 실제로 사용되지 않는 공간이 발생하는 현상이다.

예를 들어:

```java
// 메모리 할당자가 8바이트 단위로 할당한다고 가정 
byte[] data = new byte[22];  // 22바이트 요청 
// 실제로는 24바이트(8바이트 경계에 맞춤)가 할당됨 
// → 2바이트의 내부 파편화 발생
```

파편화는 다음과 같은 영향을 미친다:

- **메모리 낭비**: 사용 가능한 메모리가 있음에도 실제로 사용할 수 없게 되어 낭비된다.
    
- **성능 저하**: 사용 가능한 메모리를 찾기 위한 검색 시간이 증가한다.
    
- **메모리 할당 실패**: 충분한 연속된 메모리가 없어 새로운 할당 요청이 실패할 수 있다.
    

## 파편화 해결 방법

### 1. 메모리 압축(Compaction)

사용 중인 메모리 블록을 한쪽으로 모아 연속된 큰 빈 공간을 만든다. 이는 외부 파편화를 효과적으로 해결하지만, 메모리 복사 비용이 크고 프로세스 실행을 일시 중단해야 한다.

```java
void compactMemory() {     
    Address destination = startOfHeap;         
    for (Block block : heap) {        
        if (block.isInUse()) {            
            moveBlock(block, destination);            
            destination += block.size;        
        }    
    }         
    markAsFree(destination, endOfHeap - destination); 
}
```

### 2. 가비지 컬렉션(Garbage Collection)

더 이상 참조되지 않는 객체를 자동으로 탐지하여 메모리를 해제한다. 이는 많은 현대 프로그래밍 언어(Java, Python 등)에서 사용된다.

### 3. Best-fit 알고리즘

요청 크기에 가장 가까운 빈 블록을 선택하여 내부 파편화를 줄인다.

```java
Block* allocateBestFit(size_t size) {     
    Block* bestBlock = NULL;    
    size_t bestSize = SIZE_MAX;         
    for (Block* block = freeList; block != NULL; block = block->next) {        
        if (block->size >= size && block->size < bestSize) {            
            bestBlock = block;            
            bestSize = block->size;        
        }    
    }         
    if (bestBlock != NULL) {        
        bestBlock->inUse = true;        
        removeFromFreeList(bestBlock);    
    }         
    return bestBlock; 
}
```

### 4. 메모리 풀(Memory Pool)

동일한 크기의 객체를 위한 메모리를 미리 할당하여 관리한다.

```java
public class MemoryPool<T> {     
    private final Object[] pool;    
    private final boolean[] inUse;         
    
    public MemoryPool(int capacity) {        
        this.pool = new Object[capacity];        
        this.inUse = new boolean[capacity];    
    }         
    
    public T allocate() {        
        for (int i = 0; i < pool.length; i++) {            
            if (!inUse[i]) {                
                inUse[i] = true;                
                return (T) pool[i];            
            }        
        }        
        throw new OutOfMemoryError("Memory pool is full");    
    }         
    
    public void free(T object) {        
        for (int i = 0; i < pool.length; i++) {            
            if (pool[i] == object) {                
                inUse[i] = false;                
                return;            
            }        
        }        
        throw new IllegalArgumentException("Object not from this pool");    
    } 
}
```

## 결론

스택과 힙은 각기 **다른 목적**을 가진 중요한 메모리 관리 구조이다. 아무리 스택이 커지더라도 동적 데이터 관리와 유연성을 제공하는 힙은 일반적으론 필요하다. 이는 단순히 메모리 크기의 문제가 아닌, **구조적인 차이**와 **목적의 차이** 때문이다.

특히 멀티스레드 환경에서는 여러 스레드가 공유할 수 있는 메모리 공간이 필요한데, 스택은 본질적으로 스레드 의존적이고 지역적인 특성을 가지므로 이러한 용도로는 부적합하다. 또한 객체의 수명 관리에 있어서도 힙은 스택보다 훨씬 **유연한 방식**을 제공하기 때문이다.

물론 힙 메모리는 **파편화 문제**와 같은 단점이 있지만, 이는 가비지 컬렉션, 메모리 풀, 메모리 압축 등 다양한 기법으로 해결할 수 있다. 현대 프로그래밍 언어들은 이러한 **메모리 관리**를 자동화하여 개발자의 부담을 줄이고 있다.
여기까지 공부하다보니 내가 주로 쓰는 **JVM**이 어떻게 메모리 파편화 문제를 해결하고 효율적인 메모리 관리를 구현하는지 더 자세히 알아보고 싶어졌다.
[다음 글](https://velog.io/@chae0738/JVM의-메모리-구조와-가비지-컬렉션-기본-원리)에서는 이어서 JVM의 메모리 관리 시스템, 특히 **가비지 컬렉션의 세대별(Generational) 메모리 관리 방식**에 대해 더 자세히 살펴 볼 예정이다. 


## 참고자료

1. **Computer Systems: A Programmer's Perspective (3rd Edition)**
    
    - 스택과 힙의 근본적인 차이점 및 운영체제 수준의 메모리 관리에 대한 상세 설명.
        
    - 출처: [Computer Systems: A Programmer's Perspective (PDF)](https://dl.ebooksworld.ir/books/Computer.Systems.A.Programmers.Perspective.3rd.Edition.Pearson.9780134092669.EBooksWorld.ir.pdf)
        
2. **The Garbage Collection Handbook: The Art of Automatic Memory Management (2nd Edition)**
    
    - 가비지 컬렉션의 이론과 실제 구현에 대한 포괄적인 안내서.
        
    - 출처: [The Garbage Collection Handbook](https://www.routledge.com/The-Garbage-Collection-Handbook-The-Art-of-Automatic-Memory-Management/Jones-Hosking-Moss/p/book/9781032231785)
        
3. **Modern Operating Systems (4th Edition)**
    
    - 메모리 관리 시스템과 파편화 문제에 대한 심층적인 분석.
        
    - 출처: [Modern Operating Systems (Google Books)](https://books.google.com/books/about/Modern_Operating_Systems_Global_Edition.html?id=FV2pBwAAQBAJ)
        
4. **Memory Management in Java: Stack vs Heap & Garbage Collection**
    
    - 자바 메모리 관리, 스택과 힙의 차이점 및 가비지 컬렉션의 기본 원리에 대한 설명.
        
    - 출처: [Dev.to 블로그](https://dev.to/abhishek_kumar_d9009a7ae6/memory-management-in-java-stack-vs-heap-garbage-collection-1aj2)
        
5. **Java Garbage Collection Best Practices**
    
    - 자바 가비지 컬렉션의 최적화 전략 및 기본 개념 설명.
        
    - 출처: [New Relic 블로그](https://newrelic.com/kr/blog/best-practices/java-garbage-collection)
