---
title: "저지연 GC 알고리즘을 알아보자"
description: "산출물 지옥 탈출했으면 공부해야지?"
date: 2025-04-25
category: cs
tags: ["GC", "JVM", "저지연"]
cover: ./cover.jpg
velogUrl: https://velog.io/@chae0738/%EC%A0%80%EC%A7%80%EC%97%B0-GC-%EC%95%8C%EA%B3%A0%EB%A6%AC%EC%A6%98%EC%9D%84-%EC%95%8C%EC%95%84%EB%B3%B4%EC%9E%90
---

## 최근 근황

분명 3~4일에 한번은 블로그에 공부 내용을 정리하자고 마음을 먹었지만, 최근들어 사이드 프로젝트에서 이상한거(모놀리식 -> 모듈형(MSA)로 이식)에 맛들려서 새벽까지 개발만 하다 잠들었다. 그래도 이제는 얼추 전환이 완료되고 시간이 생겨 공부한 내용을 정리해보고자 한다.

[지난 글](https://velog.io/@chae0738/%EB%A9%94%EB%AA%A8%EB%A6%AC-%EA%B4%80%EB%A6%AC-%EC%B5%9C%EC%A0%81%ED%99%94-%EA%B8%B0%EB%B2%95-%EC%95%8C%EC%95%84%EB%B3%B4%EA%B8%B0)에서는 고성능 애플리케이션을 위한 메모리 관리 최적화 기법들을 살펴보았다. 이번 글에서는 마지막으로 최신 저지연(Low-Latency) 가비지 컬렉션 알고리즘의 원리와 활용법, 그리고 메모리 관리 기술의 현재 트렌드와 미래 방향성에 대해 알아보고자 한다.

## 저지연 GC 알고리즘의 등장 배경

기존 GC 알고리즘들의 가장 큰 문제점은 `Stop-the-World` 이벤트다. 이는 가비지 컬렉션이 실행되는 동안 모든 애플리케이션 스레드가 일시 중지되는 현상으로, 높은 응답성이 요구되는 금융 거래, 온라인 게임, 실시간 분석 같은 분야에서는 치명적이다.

예를 들어 CMS(Concurrent Mark Sweep)나 G1(Garbage First) GC도 대부분의 작업을 애플리케이션과 동시에 수행하지만, 여전히 특정 단계에서는 Stop-the-World가 발생한다. 이런 일시 중지는 수백 밀리초에 달할 수 있어 응답 시간에 민감한 애플리케이션에서는 문제가 된다.

이러한 문제를 해결하기 위해 JDK 11부터 도입된 ZGC와 Shenandoah GC 같은 최신 저지연 GC 알고리즘은 **중지 시간을 10ms 이내**로 줄이는 것을 목표로 한다.

## ZGC (Z Garbage Collector)

ZGC는 JDK 11에서 실험 기능으로 처음 도입되었고, JDK 15에서 정식 기능이 되었다. "Scalable Low-Latency Garbage Collector"라는 부제처럼, **대용량 힙에서도 짧은 중지 시간**을 유지하는 것이 목표다.

### ZGC의 핵심 특징

1. **동시성(Concurrency)**: 모든 주요 GC 작업(마킹, 재배치, 참조 업데이트)을 애플리케이션 실행과 동시에 수행한다.
2. **규모 독립적 중지 시간(Pause Times)**: 힙 크기나 라이브 객체 수에 관계없이 일정한 중지 시간(기본적으로 <10ms)을 유지한다.
3. **컬러드 포인터(Colored Pointers)**: 객체 참조의 몇 비트를 활용하여 GC 상태 정보를 저장한다.
4. **로드 배리어(Load Barriers)**: 객체 참조 접근 시 참조의 유효성을 확인하고 필요하면 수정한다.

### ZGC의 동작 원리

ZGC는 핵심적으로 다른 GC들과 달리, 포인터 착색(pointer coloring)이라는 기술을 사용한다. 64비트 포인터의 일부 비트(메타데이터 비트)를 이용해 포인터가 가리키는 객체의 상태를 표시한다.

```
포인터의 구조 (64비트 환경):
[ 메타데이터 비트 | 실제 메모리 주소 ]
```

이 메타데이터 비트는 다음을 표시한다:

- **Mark/Relocation 비트**: 객체가 살아있는지, 이동 중인지 표시
- **Finalizable 비트**: 객체가 finalize 호출이 필요한지 표시

이 정보를 통해 ZGC는 객체 참조가 사용될 때마다 로드 배리어를 통해 참조의 유효성을 확인하고 필요하면 업데이트할 수 있다.

### ZGC의 컬렉션 사이클

ZGC의 컬렉션 사이클은 다음 단계로 구성된다:

1. **동시 마킹(Concurrent Mark)**: 모든 살아있는 객체를 식별한다.
2. **동시 참조 처리(Concurrent Reference Processing)**: Weak/Soft/Phantom 참조를 처리한다.
3. **동시 재배치 준비(Concurrent Prepare for Relocate)**: 재배치할 영역을 선택한다.
4. **동시 재배치(Concurrent Relocate)**: 선택된 객체들을 새로운 위치로 복사한다.

각 단계 사이에는 매우 짧은 중지(Pause) 시간만 있으며, 이는 주로 로드 배리어의 상태 전환과 같은 작업에 사용된다.

### ZGC 사용 예시

ZGC를 활성화하는 것은 JVM 옵션으로 간단히 할 수 있다:

```bash
# JDK 15 이상
java -XX:+UseZGC MyApplication

# JDK 11-14 (실험 기능으로 사용)
java -XX:+UnlockExperimentalVMOptions -XX:+UseZGC MyApplication

# 힙 크기 설정과 함께 사용
java -XX:+UseZGC -Xms4G -Xmx16G MyApplication
```

ZGC는 기본적으로 모든 CPU 코어를 활용하도록 설정되어 있지만, 다음과 같이 병렬 스레드 수를 제한할 수도 있다:

```bash
java -XX:+UseZGC -XX:ConcGCThreads=2 MyApplication
```

### 성능 분석 도구를 통한 ZGC 모니터링

ZGC의 동작을 모니터링하고 분석하기 위해 다양한 JVM 플래그와 도구를 사용할 수 있다:

```bash
# GC 로깅 활성화
java -XX:+UseZGC -Xlog:gc*=info:file=gc.log MyApplication

# JConsole이나 VisualVM으로 모니터링
jconsole
visualvm
```

로그 예시:

```
[0.073s][info][gc,init] Initializing The Z Garbage Collector
[0.073s][info][gc,init] Heap: 8192M
[0.073s][info][gc,init] Min Capacity: 8192M
[0.073s][info][gc,init] Initial Capacity: 8192M
[0.073s][info][gc,init] Max Capacity: 8192M
[0.073s][info][gc,init] Uncommit: Disabled
[0.073s][info][gc,init] Concurrent GC Threads: 4
[2.048s][info][gc,start] GC(0) Garbage Collection (Warmup)
[2.060s][info][gc,phases] GC(0) Pause Mark Start: 0.016ms
[2.086s][info][gc,phases] GC(0) Concurrent Mark: 25.643ms
[2.086s][info][gc,phases] GC(0) Pause Mark End: 0.029ms
[2.086s][info][gc,phases] GC(0) Concurrent Process Non-Strong References: 0.001ms
[2.086s][info][gc,phases] GC(0) Concurrent Reset Relocation Set: 0.001ms
[2.087s][info][gc,phases] GC(0) Concurrent Select Relocation Set: 0.773ms
[2.087s][info][gc,phases] GC(0) Pause Relocate Start: 0.011ms
[2.089s][info][gc,phases] GC(0) Concurrent Relocate: 1.880ms
[2.089s][info][gc,load] GC(0) Load: 0.00/0.00/0.00
[2.089s][info][gc,mmu] GC(0) MMU: 2ms/98.7%, 5ms/99.5%, 10ms/99.7%, 20ms/99.9%, 50ms/99.9%, 100ms/99.9%
[2.089s][info][gc,marking] GC(0) Mark: 4 stripe(s), 2 proactive flush(es), 1 terminate flush(es), 0 completion(s), 0 continuation(s)
[2.089s][info][gc,reloc] GC(0) Relocation: Successful, 8M relocated
[2.089s][info][gc,nmethod] GC(0) NMethods: 1129 registered, 0 unregistered
[2.089s][info][gc,metaspace] GC(0) Metaspace: 6M used, 6M committed, 8M reserved
[2.089s][info][gc,ref] GC(0) Soft: 122 encountered, 0 discovered, 0 enqueued
[2.089s][info][gc,ref] GC(0) Weak: 283 encountered, 0 discovered, 0 enqueued
[2.089s][info][gc,ref] GC(0) Final: 33 encountered, 0 discovered, 0 enqueued
[2.089s][info][gc,ref] GC(0) Phantom: 18 encountered, 0 discovered, 0 enqueued
[2.089s][info][gc,heap] GC(0) Min Capacity: 8192M(100%)
[2.089s][info][gc,heap] GC(0) Max Capacity: 8192M(100%)
[2.089s][info][gc,heap] GC(0) Soft Max Capacity: 8192M(100%)
[2.089s][info][gc,time] GC(0) Clock: 42.0ms, 33.0ms spent in safepoints (78% of total time)
[2.089s][info][gc,time] GC(0) User: 110.0ms, System: 10.0ms
[2.089s][info][gc] GC(0) Garbage Collection (Warmup) 4021M(49%)->31M(0%)
```

이 로그에서 주목할 점은 **각 단계의 소요 시간**이다. 특히 Pause Mark Start, Pause Mark End, Pause Relocate Start 등의 중지 시간이 모두 1ms 미만으로 매우 짧다.

## Shenandoah GC

Shenandoah는 Red Hat에서 개발한 저지연 GC로, JDK 12에서 실험 기능으로 도입되었고 JDK 15에서 정식 기능이 되었다. ZGC와 마찬가지로 짧은 중지 시간을 목표로 하지만, 구현 방식에서 차이가 있다.

### Shenandoah의 핵심 특징

1. **동시 복사(Concurrent Copying)**: 객체 복사를 앱 실행과 동시에 수행
2. **브룩스 포인터(Brooks Pointers)**: 각 객체에 포워딩 포인터를 추가하여 재배치를 관리
3. **느슨한 인도네이터(Relaxed Invariator)**: 힙 내의 참조 일관성에 대한 요구사항 완화
4. **읽기/쓰기 배리어**: 참조의 일관성 유지를 위한 메커니즘

### Shenandoah vs ZGC

Shenandoah와 ZGC는 모두 저지연 목표를 공유하지만, 몇 가지 중요한 차이점이 있다:

1. **포인터 표현**:
    
    - ZGC: 포인터 자체에 메타데이터 비트 활용 (Colored Pointers)
    - Shenandoah: 각 객체 내에 포워딩 포인터 포함 (Brooks Pointers)
2. **배리어 메커니즘**:
    
    - ZGC: 로드 배리어만 사용
    - Shenandoah: 읽기 및 쓰기 배리어 모두 사용
3. **힙 구조**:
    
    - ZGC: 큰 영역(Region)으로 힙 관리, 압축에 더 효율적
    - Shenandoah: 상대적으로 작은 영역으로 관리, 더 세밀한 공간 회수

### Shenandoah 사용 예시

```bash
# JDK 15 이상
java -XX:+UseShenandoahGC MyApplication

# JDK 12-14 (실험 기능으로 사용)
java -XX:+UnlockExperimentalVMOptions -XX:+UseShenandoahGC MyApplication
```

Shenandoah는 다양한 모드를 제공한다:

```bash
# 적극적인 모드 (더 많은 주기적 GC 실행)
java -XX:+UseShenandoahGC -XX:ShenandoahGCMode=aggressive MyApplication

# 정적 힙 모드 (크기 변화가 없는 힙에 최적화)
java -XX:+UseShenandoahGC -XX:ShenandoahGCMode=static MyApplication
```

## 저지연 GC의 실제 응용 사례

저지연 GC는 어떤 상황에서 가장 큰 이점을 발휘할까? 다음과 같은 사례들을 살펴보자.

### 1. 금융 거래 시스템

```java
@Service
public class StockTradingService {
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private PriceEngine priceEngine;
    
    @Timed
    public OrderResult executeOrder(Order order) {
        // SLA: 95% of orders must execute in under 50ms
        long startTime = System.nanoTime();
        
        // Price calculation 
        BigDecimal executionPrice = priceEngine.calculateBestPrice(order);
        
        // Order execution
        OrderResult result = orderRepository.execute(order, executionPrice);
        
        // Metrics
        long duration = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startTime);
        if (duration > 50) {
            // 50ms를 초과하면 이상 감지 시스템에 알림
            alertSlowExecution(order, duration);
        }
        
        return result;
    }
}
```

이런 금융 시스템에서는 GC 일시 중지로 인한 지연이 수백 밀리초에 달하면 SLA(Service Level Agreement)를 위반할 수 있다. ZGC나 Shenandoah를 사용하면 최대 중지 시간을 10ms 이내로 유지하여 이를 방지할 수 있다.

### 2. 온라인 게임 서버

```java
@Component
public class GameWorldProcessor {
    private final List<Player> players = new CopyOnWriteArrayList<>();
    private final PhysicsEngine physicsEngine;
    
    @Scheduled(fixedRate = 20) // 20ms 간격으로 게임 틱 실행 (50 fps)
    public void processTick() {
        long tickStart = System.nanoTime();
        
        // 물리 계산
        physicsEngine.updateAll();
        
        // 모든 플레이어 상태 업데이트 및 동기화
        for (Player player : players) {
            player.update();
            if (player.needsSync()) {
                player.sendWorldState();
            }
        }
        
        long tickDuration = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - tickStart);
        if (tickDuration > 20) {
            // 프레임 드롭 기록
            logFrameDrop(tickDuration);
        }
    }
}
```

온라인 게임에서 프레임 드롭은 플레이어 경험을 크게 해친다. 50fps로 실행되는 게임은 프레임당 20ms 이내에 모든 처리를 마쳐야 하는데, GC로 인한 100ms 이상의 중지는 명백한 끊김으로 인식된다.

### 3. 실시간 스트리밍 데이터 처리

```java
@Component
public class StockMarketDataProcessor {
    private final Queue<MarketDataEvent> incomingEvents = new ConcurrentLinkedQueue<>();
    private final DataAnalyticsEngine analyticsEngine;
    
    @Scheduled(fixedRate = 5) // 5ms 간격으로 데이터 처리
    public void processIncomingData() {
        MarketDataEvent event;
        while ((event = incomingEvents.poll()) != null) {
            // 이벤트 처리 및 분석
            analyticsEngine.processEvent(event);
            
            // 트레이딩 알고리즘에 즉시 알림
            notifyTradingAlgorithms(event);
        }
    }
}
```

고빈도 트레이딩 시스템에서는 밀리초 단위의 지연도 중요하며, 시장 데이터를 실시간으로 처리하지 못하면 중요한 투자 기회를 놓칠 수 있다.

## GC 튜닝: 저지연과 처리량 간의 균형

저지연 GC는 모든 상황에서 최선의 선택이 아닐 수 있다. 다음은 애플리케이션 유형별 GC 권장 사항이다.

1. **배치 처리 작업(Batch Processing)**: 처리량 중심 → Parallel GC
    
    ```bash
    java -XX:+UseParallelGC -Xms4G -Xmx4G BatchProcessor
    ```
    
2. **웹 서버/서비스**: 처리량과 지연 시간 균형 → G1 GC
    
    ```bash
    java -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -Xms2G -Xmx2G WebServer
    ```
    
3. **실시간 거래/서비스**: 최소 지연 시간 → ZGC 또는 Shenandoah
    
    ```bash
    java -XX:+UseZGC -Xms4G -Xmx4G RealTimeService
    ```
    

## 메모리 관리의 미래 트렌드

최신 메모리 관리 기술과 앞으로의 발전 방향을 살펴보자.

### 1. GC 개선을 위한 하드웨어 지원

최신 CPU 아키텍처는 GC 작업에 도움이 되는 하드웨어 기능을 제공한다.

- **메모리 주소 태깅(Memory Tagging)**: ARM v8.5 아키텍처의 MTE(Memory Tagging Extension)는 메모리 안전성 검사를 위한 하드웨어 지원을 제공
- **확장된 메모리 관리**: 인텔의 PMem(Persistent Memory)과 같은 기술은 새로운 계층의 메모리 관리 가능성을 제시

### 2. 비휘발성 메모리(Non-Volatile Memory)

인텔 옵테인 같은 PMem 기술은 DRAM보다 느리지만 훨씬 큰 용량을 제공하고 전원이 꺼져도 데이터가 유지된다. 자바에서는 이러한 PMem을 활용하기 위한 API가 발전 중이다.

```java
// 가상의 PMem API 예시
try (PersistentMemoryRegion region = 
        PersistentMemory.mapFile(new File("/pmem/data"), 10 * 1024 * 1024)) {
    
    // 영구 메모리에 직접 데이터 쓰기
    region.putLong(0, 123456789L);
    region.putInt(8, 42);
    region.putBytes(12, "Hello, PMem".getBytes());
    
    // 변경사항 영구적으로 플러시
    region.persist(0, 30);
}
```

### 3. 코드 생성 기반 메모리 관리

GraalVM과 같은 네이티브 이미지 컴파일러는 AOT(Ahead-of-Time) 컴파일을 통해 메모리 관리 방식을 변화시키고 있다.

- **정적 분석**: 컴파일 시점에 객체 수명 분석을 통한 메모리 관리 최적화
- **에스케이프 분석 개선**: 힙 할당이 필요 없는 객체 자동 식별
- **부분적 수동 메모리 관리**: 성능 중요 경로에서 수동 메모리 관리 옵션 제공

### 4. 언어 수준의 메모리 제어 향상

Java의 Project Valhalla와 같은 이니셔티브는 값 타입(Value Types)을 도입하여 메모리 사용 패턴을 개선한다.

```java
// Project Valhalla의 값 타입 예시 (Java 미래 버전)
value class Point {
    private final int x;
    private final int y;
    
    public Point(int x, int y) {
        this.x = x;
        this.y = y;
    }
    
    public int x() { return x; }
    public int y() { return y; }
}

// 이 값 타입은 별도의 힙 할당 없이 인라인 저장 가능
void process() {
    Point p = new Point(10, 20); // 힙 할당 없음
    doSomething(p); // 값 복사, 참조 아님
}
```

값 타입은 힙 할당과 GC 부담을 줄이고 캐시 효율성을 높인다.

### 5. 대용량 데이터를 위한 하이브리드 메모리 관리

Java와 네이티브 코드를 결합한 하이브리드 메모리 관리 접근법 예시:

```java
public class HybridMemoryManager {
    // JNI를 통해 네이티브 메모리 관리 접근
    private static native long allocateNative(long size);
    private static native void freeNative(long address);
    
    // Try-with-resources 패턴을 위한 자원 관리
    public static class OffHeapMemory implements AutoCloseable {
        private final long address;
        private final long size;
        
        private OffHeapMemory(long size) {
            this.size = size;
            this.address = allocateNative(size);
            if (this.address == 0) {
                throw new OutOfMemoryError("Native allocation failed");
            }
        }
        
        public long address() { return address; }
        
        @Override
        public void close() {
            freeNative(address);
        }
    }
    
    public static OffHeapMemory allocate(long size) {
        return new OffHeapMemory(size);
    }
    
    // Unsafe를 사용한 메모리 접근 래퍼 (성능 중요 코드용)
    private static final Unsafe UNSAFE = getUnsafe();
    
    public static void putInt(long address, int value) {
        UNSAFE.putInt(address, value);
    }
    
    public static int getInt(long address) {
        return UNSAFE.getInt(address);
    }
    
    // 기타 데이터 타입에 대한 메서드...
    
    private static Unsafe getUnsafe() {
        try {
            Field field = Unsafe.class.getDeclaredField("theUnsafe");
            field.setAccessible(true);
            return (Unsafe) field.get(null);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}

// 사용 예시
try (HybridMemoryManager.OffHeapMemory memory = 
        HybridMemoryManager.allocate(1024 * 1024)) {
        
    long address = memory.address();
    
    // 직접 메모리 접근
    HybridMemoryManager.putInt(address, 42);
    int value = HybridMemoryManager.getInt(address);
    
    // 대용량 데이터 처리...
}
```

## 결론 및 향후 학습 방향

유튜브 한편에서 시작된 여정이 스택과 힙의 기본 개념부터 시작해 JVM의 메모리 구조, GC 알고리즘, 고성능 애플리케이션을 위한 최적화 기법, 그리고 최신 저지연 GC 알고리즘까지 폭넓게 살펴보는 계기가 되었다.

메모리 관리는 소프트웨어 개발, 특히 고성능 애플리케이션 개발에서 핵심적인 부분이다. 효율적인 메모리 관리는 애플리케이션의 성능, 안정성, 사용자 경험을 크게 향상시킬 수 있기 때문이다. `SI는 그런거 안해`

개인적으로는 이번 공부를 통해 얻은 지식을 기반으로 다음과 같은 주제들을 더 깊이 탐구해보고 싶어졌다.

1. **JVM 내부 구현**: HotSpot JVM의 세부 구현과 동작 원리
2. **커스텀 GC 알고리즘 개발**: Java에서 제공하는 다양한 GC 알고리즘의 적용 방식과 맞춤형 GC 구현 가능성
3. **진화하는 메모리 아키텍처**: 비휘발성 메모리, 분산 메모리 시스템 등 최신 메모리 기술 활용 방안

메모리 관리는 끊임없이 발전하는 분야이며, 새로운 하드웨어 기술과 소프트웨어 패러다임에 따라 계속해서 변화할 것이다. 이런 변화에 발맞춰 학습하고 적응하는 것이 중요하다고 생각한다.

지금 가지고 있는 열정을 잃지 않는 개발자가 되자!

## 참고자료
#### 1. **ZGC 관련 문서**

- [OpenJDK Wiki: ZGC 공식 설명 및 최신 변경사항](https://wiki.openjdk.org/display/zgc/Main)  
- [JavaCodeGeeks: 2025년 ZGC 최신 동향 및 저지연 GC 비교](https://www.javacodegeeks.com/2025/01/optimizing-java-memory-new-garbage-collectors-in-2025.html)  
- [Inside Java: ZGC의 역사와 주요 특징 정리](https://inside.java/2022/05/30/sip053/)  

#### 2. **Shenandoah GC**

- [Red Hat 개발자 공식 가이드: Shenandoah GC 입문](https://developers.redhat.com/articles/2024/05/28/beginners-guide-shenandoah-garbage-collector)  
- [OpenJDK Wiki: Shenandoah 공식 문서](https://wiki.openjdk.org/display/shenandoah/Main)  
- [JavaCodeGeeks: 2025년 저지연 GC 비교 (ZGC vs Shenandoah)](https://www.javacodegeeks.com/2025/01/optimizing-java-memory-new-garbage-collectors-in-2025.html)  

#### 3. **Project Valhalla (값 타입 등 차세대 메모리 모델)**

- [InfoQ: Project Valhalla 최신 동향 및 릴리스 소식](https://www.infoq.com/ProjectValhalla/news/)  
- [OpenJDK 공식: Project Valhalla 개요](https://openjdk.org/projects/valhalla/)  
- [Java 23 릴리스: 값 타입 등 영구 기능 반영](https://itnext.io/3-permanent-features-in-java-23-17229ee4b8c0)  

#### 4. **비휘발성 메모리 및 하드웨어 지원**

- [Oracle Labs: Java와 Non-Volatile Memory 활용](https://labs.oracle.com/pls/apex/f?p=LABS%3A0%3A16890215513273%3AAPPLICATION_PROCESS%3DGETDOC_INLINE%3A%3A%3ADOC_ID%3A1304)  
- [OpenJDK JEP 442: Foreign Function & Memory API](https://openjdk.org/jeps/442)  

#### 5. **GC 튜닝 및 모니터링**

- [GC Easy: Serial GC 및 주요 GC 튜닝 옵션 설명](https://blog.gceasy.io/serial-gc-tuning/) 
- [Inside Java: 머신러닝 기반 JVM 튜닝 사례](https://inside.java/2025/01/13/thesis-jvm-tuning-ml/) 

#### 6. **하이브리드 메모리 관리 및 네이티브 연동**

- [OpenJDK JEP 442: Foreign Function & Memory API](https://openjdk.org/jeps/442)  
- [ISMM 2015: 하이브리드 메모리 관리 논문](https://conf.researchr.org/details/ismm-2015/ismm-2015-papers/4/Safe-and-Efficient-Hybrid-Memory-Management-for-Java)  

#### 7. **최신 JDK 릴리스 및 플랫폼 지원**

- [Azul Zulu OpenJDK 24/21/17/11/8/7/6 공식 릴리스 노트 (2025년 4월)](https://docs.azul.com/core/release-notes)
