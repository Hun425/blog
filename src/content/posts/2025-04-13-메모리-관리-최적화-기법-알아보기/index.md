---
title: "메모리 관리 최적화 기법 알아보기"
description: "SI의 현실을 아는사람: ㄱ-"
date: 2025-04-13
category: cs
tags: ["메모리", "최적화"]
cover: ./cover.png
velogUrl: https://velog.io/@chae0738/%EB%A9%94%EB%AA%A8%EB%A6%AC-%EA%B4%80%EB%A6%AC-%EC%B5%9C%EC%A0%81%ED%99%94-%EA%B8%B0%EB%B2%95-%EC%95%8C%EC%95%84%EB%B3%B4%EA%B8%B0
---

## 최근 근황
회사에서 개발 코드는 만지지도 못하고 엑셀과 PPT만 한지 거의 1달이 다되어간다.
사실상 진짜 개발과 공부는 퇴근이후에 하다보니, 내가 개발을 취미로 하고있는건가? 착각이 들기도 한다. 이런 스트레스 때문에 요즘 밥도 제대로 못먹었는 상황이다.. 이러한 스트레스 받는 상황에서도 내 최종 목표를 위한 공부는 멈출 수 없기 때문에 공부한 내용을 기록해 보고자 한다.


[지난 글](https://velog.io/@chae0738/JVM%EC%9D%98-%EB%A9%94%EB%AA%A8%EB%A6%AC-%EA%B5%AC%EC%A1%B0%EC%99%80-%EA%B0%80%EB%B9%84%EC%A7%80-%EC%BB%AC%EB%A0%89%EC%85%98-%EA%B8%B0%EB%B3%B8-%EC%9B%90%EB%A6%AC)에서는 JVM 메모리 구조와 가비지 컬렉션(GC)의 기본 원리를 살펴보았다. 이번 글에서는 한 단계 더 나아가, 고성능 애플리케이션, 특히 게임 서버, 금융 거래 시스템, 실시간 데이터 처리 엔진처럼 **낮은 지연 시간(Low Latency)**과 **높은 처리량(High Throughput)**이 생명인 시스템을 위한 메모리 관리 최적화 기법들을 코드 예제와 함께 소개하고자 한다.

## **고성능 애플리케이션의 메모리 관리 과제**

이러한 고성능 시스템은 메모리 관리 측면에서 다음과 같은 특별한 요구사항들을 가진다.

- **예측 가능한 성능:** GC로 인한 예측 불가능한 지연 시간(특히 Stop-the-world) 최소화.
- **높은 처리량:** 초당 수십만 건 이상의 요청을 처리할 수 있는 능력.
- **리소스 효율성:** 제한된 메모리 자원을 최대한 효율적으로 활용.
- **안정성:** 메모리 누수나 심각한 파편화 없이 장기간 안정적으로 실행 가능.

이를 위해서는 언어에서 기본 제공하는 기능을 넘어선 세심한 메모리 관리 전략이 필요하다.

### **1. 커스텀 메모리 풀 (Object Pool)**

동일한 크기의 객체를 반복적으로 생성하고 해제하는 것은 상당한 오버헤드를 유발한다. **메모리 풀**은 객체를 미리 생성해두고 필요할 때 빌려 쓰고 반납하는 방식으로, 이러한 오버헤드를 줄이고 GC 부담을 완화하며 메모리 파편화를 방지한다.


``` java
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.function.Supplier;
import java.util.function.Consumer;
import java.util.concurrent.atomic.AtomicInteger;

// 간단한 객체 풀 예시
public class ObjectPool<T> {
    private final BlockingQueue<T> pool;
    private final Supplier<T> objectFactory;
    private final Consumer<T> objectResetter; // 객체 반납 시 초기화 로직
    private final int maxSize;
    // ... (생성자 등)

    public ObjectPool(Supplier<T> factory, Consumer<T> resetter, int maxSize) {
        this.objectFactory = factory;
        this.objectResetter = resetter;
        this.maxSize = maxSize;
        this.pool = new LinkedBlockingQueue<>(maxSize);
        // 필요하다면 초기 풀 채우기 로직 추가 가능
    }

    public T borrow() throws InterruptedException {
        T object = pool.poll(); // 풀에서 즉시 가져오기 시도
        if (object == null) {
            // 풀이 비었으면 새로 생성 (최대 크기 제한 고려) 또는 대기
            // 여기서는 간단히 대기하는 로직 (실제 구현은 더 복잡할 수 있음)
            object = pool.take(); // 다른 스레드가 반납할 때까지 대기
        }
        return object;
    }

    public void release(T object) {
        if (object != null) {
            objectResetter.accept(object); // 객체 상태 초기화
            pool.offer(object);           // 풀에 반납 (가득 찼으면 실패 가능)
        }
    }
}

// 사용 예시 (게임 서버의 플레이어 객체)
ObjectPool<Player> playerPool = new ObjectPool<>(
    Player::new,  // Player 객체 생성 팩토리
    Player::reset, // 사용 후 Player 상태 초기화 메서드
    1000          // 최대 1000개까지 풀링
);

// ...
Player p = playerPool.borrow();
try {
    // 플레이어 객체 사용 로직
} finally {
    playerPool.release(p);
}
```

### **2. 직접 메모리 (Direct Memory) 활용**

Java NIO의 `ByteBuffer.allocateDirect()`는 JVM 힙(Heap)이 아닌 OS 네이티브 메모리를 직접 사용한다. 이는 대용량 파일 처리나 네트워크 소켓 I/O 시 GC의 부담을 줄이고 OS 레벨의 I/O 최적화를 활용하여 성능을 높일 수 있다.


``` java
import java.nio.ByteBuffer;

public class DirectMemoryExample {
    public static void main(String[] args) {
        // 100MB의 직접 메모리 할당
        ByteBuffer directBuffer = ByteBuffer.allocateDirect(100 * 1024 * 1024);

        try {
            // 데이터 쓰기
            for (int i = 0; i < 100; i++) {
                directBuffer.putInt(i * i);
            }
            directBuffer.flip(); // 쓰기 모드 -> 읽기 모드 전환

            // 데이터 읽기
            while (directBuffer.hasRemaining()) {
                int value = directBuffer.getInt();
                // System.out.println(value);
            }
        } finally {
            // 직접 메모리는 GC 대상이 아니지만,
            // 참조가 사라지면 Cleaner 메커니즘 등을 통해 해제됨.
            // 명시적 해제 API는 없으나, 시스템 자원이므로 누수되지 않도록 주의.
            // (예: try-with-resources 와 함께 사용하는 라이브러리 활용)
        }
        // -XX:MaxDirectMemorySize 옵션으로 최대 크기 제한 가능
    }
}
```

**주의:** 직접 메모리는 GC의 관리 대상이 아니므로, 너무 많이 할당하거나 해제가 제대로 관리되지 않으면 `OutOfMemoryError` (네이티브 메모리 부족)가 발생할 수 있다.

### **3. 배열 재사용 및 성장 전략**

데이터 크기가 가변적일 때, 데이터를 담을 배열(주로 `byte[]`)을 필요할 때마다 새로 생성하면 비효율적이다. `ArrayList` 내부 구현처럼, 현재 용량이 부족할 때 약 1.5배~2배 정도 더 큰 새 배열을 할당하고 기존 데이터를 복사(`System.arraycopy`)하는 전략이 일반적이다. 사용 후에는 배열을 버리지 않고 내부 상태(예: `position`)만 초기화하여 재사용한다.


``` java
private byte[] buffer;
private int position = 0;
private int capacity; // 현재 버퍼의 실제 크기

// ... (생성자)

private void ensureCapacity(int requiredCapacity) {
    if (capacity >= requiredCapacity) {
        return; // 이미 충분한 용량
    }

    // 성장 전략: 보통 1.5배 또는 2배로 늘림
    int newCapacity = Math.max(capacity * 3 / 2, requiredCapacity);
    byte[] newBuffer = new byte[newCapacity];

    // 기존 데이터 복사
    if (position > 0) {
        System.arraycopy(buffer, 0, newBuffer, 0, position);
    }
    buffer = newBuffer; // 새 버퍼로 교체
    capacity = newCapacity;
    // System.out.println("Buffer grown to: " + newCapacity);
}

public void write(byte data) {
    ensureCapacity(position + 1);
    buffer[position++] = data;
}

public void reset() {
    position = 0; // 내용만 초기화, 버퍼는 재사용
}
```

### **4. 메모리 정렬 및 캐시 친화적 설계**

CPU는 메모리에서 데이터를 읽어올 때 캐시 라인(예: 64바이트) 단위로 가져온다. 관련 데이터를 메모리 상에 가깝게 배치하면 캐시 히트율이 높아져 성능이 향상된다.

- **구조체 배열 (AoS: Array of Structures):** 일반적인 객체 지향 방식. 객체들이 메모리에 흩어질 수 있음.
    
    
    ``` java
    class Particle { float x, y, z, vx, vy, vz; }
    Particle[] particles = new Particle[N];
    ```
    
- **배열 구조체 (SoA: Structure of Arrays):** 데이터 중심 방식. 동일 타입의 데이터가 연속적으로 배치되어 특정 연산에 유리.
    
    
    ``` java
    class ParticleSystem {
        float[] x, y, z;
        float[] vx, vy, vz;
        // 생성자에서 각 배열 초기화
        ParticleSystem(int N) {
            x = new float[N]; y = new float[N]; z = new float[N];
            vx = new float[N]; vy = new float[N]; vz = new float[N];
        }
    }
    // 사용 예: 모든 파티클의 x좌표 업데이트 시 캐시 효율적
    for (int i = 0; i < N; i++) {
        particleSystem.x[i] += particleSystem.vx[i] * dt;
    }
    ```
    
    SoA 방식은 특히 대량의 데이터를 순차적으로 처리하는 계산(SIMD 연산 등)에서 성능 이점을 가진다.

### **5. 오프힙(Off-Heap) 메모리 솔루션**

수십 GB 이상의 매우 큰 메모리가 필요하거나, GC로 인한 지연을 극도로 피해야 할 때 고려한다. Chronicle Map, Ehcache (엔터프라이즈 버전), Apache Ignite 등은 JVM 힙 외부에 데이터를 저장하는 기능을 제공한다.



 ``` java
// Chronicle Map 사용 예시 (라이브러리 필요)
import net.openhft.chronicle.map.ChronicleMap;
import net.openhft.chronicle.map.ChronicleMapBuilder;
import java.io.File;

// ...
File mapFile = new File("my_offheap_cache.dat");
long numberOfEntries = 1_000_000; // 백만 개 항목 예상
int averageKeySizeBytes = 30;    // 평균 키 크기 (바이트)
int averageValueSizeBytes = 1024; // 평균 값 크기 (1KB)

try (ChronicleMap<String, byte[]> offHeapMap = ChronicleMapBuilder
        .of(String.class, byte[].class)
        .averageKeySize(averageKeySizeBytes)
        .averageValueSize(averageValueSizeBytes)
        .entries(numberOfEntries)
        .createPersistedTo(mapFile)) // 파일 기반 오프힙 저장소 생성
{
    // 데이터 저장
    byte[] sampleData = new byte[1024];
    // ... 데이터 채우기 ...
    offHeapMap.put("user:session:12345", sampleData);

    // 데이터 조회
    byte[] retrievedData = offHeapMap.get("user:session:12345");

    // ... 사용 ...
} catch (Exception e) {
    // 예외 처리
}
```

### **6.커스텀 메모리 할당자: 슬랩 할당자 (Slab Allocator)**

매우 낮은 수준의 제어가 필요할 때 직접 메모리 할당자를 구현하기도 한다. 슬랩 할당자는 특정 크기의 객체들을 위한 큰 메모리 청크(슬랩)를 미리 할당하고, 그 안에서 작은 단위(슬롯)를 빠르게 할당/해제하는 방식이다. 파편화를 줄이고 할당/해제 속도를 높일 수 있지만, 구현이 복잡하다.



``` java
// 슬랩 할당자의 핵심 아이디어 (단순화된 슬랩 내부 로직)
private static class Slab {
    private final int slotSize;
    private final byte[] memory; // 실제 메모리 영역
    private final BitSet usedSlots; // 어떤 슬롯이 사용 중인지 추적
    private final int totalSlots;

    // ... 생성자 ...

    public ByteBuffer allocate() { // 슬롯 할당 시도
        int freeSlotIndex = usedSlots.nextClearBit(0); // 첫 번째 비어있는 슬롯 찾기
        if (freeSlotIndex >= totalSlots) {
            return null; // 이 슬랩은 가득 참
        }
        usedSlots.set(freeSlotIndex); // 사용 중으로 표시
        int offset = freeSlotIndex * slotSize;
        // memory 배열의 해당 부분을 감싸는 ByteBuffer 반환 (Heap ByteBuffer)
        ByteBuffer buffer = ByteBuffer.wrap(memory, offset, slotSize);
        buffer.clear(); // 사용 전 초기화
        return buffer;
    }

    public boolean free(ByteBuffer buffer) { // 슬롯 해제 시도
        // 버퍼가 이 슬랩의 메모리를 가리키는지 확인
        if (buffer.array() == memory) {
            int offset = buffer.arrayOffset() + buffer.position(); // 실제 메모리 오프셋 계산
            if (offset % slotSize == 0) { // 슬롯 경계와 맞는지 확인
                int slotIndex = offset / slotSize;
                if (slotIndex >= 0 && slotIndex < totalSlots) {
                    usedSlots.clear(slotIndex); // 사용 중 표시 해제
                    return true;
                }
            }
        }
        return false; // 이 슬랩에서 할당된 버퍼가 아님
    }
}
```

### **7. 메모리 누수 방지 전략**

- **약참조(Weak Reference) 활용:** 캐시와 같이 객체를 오랫동안 참조할 수 있는 구조에서는, 해당 객체가 다른 곳에서 더 이상 강하게 참조되지 않을 때 GC가 메모리를 회수할 수 있도록 `WeakReference` 사용을 고려할 수 있다. `ReferenceQueue`와 함께 사용하여 GC된 참조를 정리하는 로직이 필요하다.
    
    
    ``` java
    // WeakReference를 사용한 캐시의 일부
    Map<Key, WeakReference<Value>> cache = new ConcurrentHashMap<>();
    ReferenceQueue<Value> queue = new ReferenceQueue<>();
    
    public void put(Key key, Value value) {
        cleanup(); // GC된 참조 정리
        cache.put(key, new WeakReference<>(value, queue));
    }
    
    private void cleanup() {
        Reference<? extends Value> ref;
        while ((ref = queue.poll()) != null) {
            // ref 와 동일한 WeakReference를 가진 엔트리를 맵에서 제거
            // (실제 구현은 더 효율적인 방식 필요)
        }
    }
    ```
    
- **주기적인 메모리 모니터링:** `MemoryMXBean`을 사용하거나 VisualVM, JProfiler 같은 도구를 통해 힙 및 비힙 메모리 사용량을 주기적으로 모니터링하여 메모리 사용량 증가 추세를 관찰하고 누수 징후를 조기에 발견해야 한다.
    
    
   ``` java
    import java.lang.management.ManagementFactory;
    import java.lang.management.MemoryMXBean;
    import java.lang.management.MemoryUsage;
    
    // ...
    MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
    MemoryUsage heapUsage = memoryBean.getHeapMemoryUsage();
    long usedHeap = heapUsage.getUsed();
    long maxHeap = heapUsage.getMax();
    System.out.printf("Heap: %.2f MB / %.2f MB (%.1f%%)%n",
            usedHeap / (1024.0*1024.0), maxHeap / (1024.0*1024.0),
            (double)usedHeap / maxHeap * 100);
    ```
    

### **8. 벤치마킹과 성능 측정**

최적화 기법 도입 전후의 성능 변화를 측정하는 것은 필수다. JMH(Java Microbenchmark Harness)를 사용하면 마이크로벤치마크를 통해 특정 코드 경로의 성능을 정밀하게 측정하고 비교할 수 있다.



``` java
import org.openjdk.jmh.annotations.*;
// ... (JMH 설정 어노테이션들)

public class MemoryAllocationBenchmark {

    @Benchmark
    public byte[] standardAllocation() {
        // 일반적인 힙 할당
        return new byte[1024];
    }

    // 객체 풀 상태 관리 (JMH @State 사용)
    @State(Scope.Benchmark)
    public static class PoolState {
        ObjectPool<byte[]> pool = new ObjectPool<>(
            () -> new byte[1024], arr -> {}, 1000);
    }

    @Benchmark
    public byte[] pooledAllocation(PoolState state) throws InterruptedException {
        // 객체 풀을 이용한 할당/반환
        byte[] buffer = state.pool.borrow();
        // ... (간단한 사용 시뮬레이션) ...
        state.pool.release(buffer);
        return buffer; // 반환 값은 보통 의미 없음
    }

    @Benchmark
    public ByteBuffer directAllocation() {
        // 직접 메모리 할당
        return ByteBuffer.allocateDirect(1024);
        // 주의: 직접 메모리는 해제 로직이 다르므로 벤치마크 설계 시 고려 필요
    }
}
```

### **결론**

고성능 애플리케이션을 위한 메모리 관리는 단순히 GC 튜닝을 넘어, **애플리케이션의 동작 방식과 데이터 특성에 맞는 최적화 기법을 선택하고 조합**하는 과정이다. 객체 풀링, 직접 메모리, 캐시 친화적 설계, 오프힙 솔루션, 커스텀 할당자 등 다양한 전략이 있으며, 각각 장단점과 복잡성을 가진다.

중요한 것은 **모든 최적화는 가설에 불과하며, 반드시 실제 환경과 유사한 조건에서 성능 측정을 통해 효과를 검증**해야 한다는 점이다.또한 이전에 얻은 교훈처럼 코드 복잡성 증가와 유지보수 비용을 고려하여 신중하게 접근해야 한다.

다음 이번 시리즈 마지막 글에서는 ZGC, Shenandoah GC와 같은 최신 저지연 GC 알고리즘의 원리와 활용 방법, 그리고 메모리 관리 기술의 최신 동향에 대해 살펴볼 예정이다.

---

**참고 자료**

- **Object Pool Pattern:**
    - Baeldung: [https://www.baeldung.com/java-object-pool](https://www.baeldung.com/java-object-pool)
    - SourceMaking: [https://sourcemaking.com/design_patterns/object_pool](https://sourcemaking.com/design_patterns/object_pool)
- **Java NIO Direct Memory:**
    - Oracle Java Docs (ByteBuffer): [https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/nio/ByteBuffer.html](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/nio/ByteBuffer.html) (allocateDirect 메소드 참고)
    - Baeldung: [https://www.baeldung.com/java-direct-bytebuffer](https://www.baeldung.com/java-direct-bytebuffer)
- **Cache Friendly Design (Data-Oriented Design):**
    - Wikipedia (Data-Oriented Design): [https://en.wikipedia.org/wiki/Data-oriented_design](https://en.wikipedia.org/wiki/Data-oriented_design)
    - Game Programming Patterns (Data Locality): [https://gameprogrammingpatterns.com/data-locality.html](https://gameprogrammingpatterns.com/data-locality.html)
- **Off-Heap Memory Solutions:**
    - Chronicle Map: [https://chronicle.software/products/chronicle-map/](https://chronicle.software/products/chronicle-map/)
    - Apache Ignite (Off-Heap Storage): [https://ignite.apache.org/docs/latest/persistence/native-persistence](https://ignite.apache.org/docs/latest/persistence/native-persistence) (개념 설명)
- **Slab Allocation:**
    - Wikipedia: [https://en.wikipedia.org/wiki/Slab_allocation](https://en.wikipedia.org/wiki/Slab_allocation)
- **Java Weak References:**
    - Baeldung: [https://www.baeldung.com/java-weak-reference](https://www.baeldung.com/java-weak-reference)
- **Java Memory Monitoring & Profiling:**
    - VisualVM: [https://visualvm.github.io/](https://visualvm.github.io/)
    - Oracle Docs (MemoryMXBean): [https://docs.oracle.com/en/java/javase/17/docs/api/java.management/java/lang/management/MemoryMXBean.html](https://docs.oracle.com/en/java/javase/17/docs/api/java.management/java/lang/management/MemoryMXBean.html)
- **JMH (Java Microbenchmark Harness):**
    - OpenJDK JMH Project: [https://openjdk.java.net/projects/code-tools/jmh/](https://openjdk.java.net/projects/code-tools/jmh/)
    - Tutorial by Jakob Jenkov: [http://tutorials.jenkov.com/java-performance/jmh.html](http://tutorials.jenkov.com/java-performance/jmh.html)
