---
title: "동시성과 순서보장을 둘 다 잡을 순 없을까?"
description: "하나만 잡기도 어려운데 두개는 어떻게 잡지"
date: 2025-01-16
category: backend
tags: ["Java", "동시성"]
cover: ./cover.webp
velogUrl: https://velog.io/@chae0738/%EB%8F%99%EC%8B%9C%EC%84%B1%EA%B3%BC-%EC%88%9C%EC%84%9C%EB%B3%B4%EC%9E%A5%EC%9D%84-%EB%91%98-%EB%8B%A4-%EC%9E%A1%EC%9D%84-%EC%88%9C-%EC%97%86%EC%9D%84%EA%B9%8C
---

동시성에 대해 공부하다가 알게된 ConcurrentHashMap의 내부 로직을 공부하던 도중, `동시성과 순서가 모두 중요한 경우에는 어떻게 관리해야 하지?`
라는 의문점에서 시작해 공부한 내용을 정리해보고자 한다.

# 동시성과 순서를 모두 고려한 Map 구현 방법 비교

데이터의 순서를 유지하면서도 동시성을 보장해야 하는 상황은 현업에서 생각보다 자주 마주하게 될 것이다.`꼭 만나보고 싶다` 
이 글에서는 이 문제를 해결하기 위한 두 가지 주요 접근 방법을 자세히 살펴보자.

## 1. CopyOnWriteArrayList + ConcurrentHashMap 방식

첫 번째 방법은 두 개의 동시성 컬렉션을 조합하여 사용하는 접근법이다.

### 구현 방식

```java
public class OrderedConcurrentManager<K, V> {
    private final ConcurrentHashMap<K, V> dataMap = new ConcurrentHashMap<>();
    private final CopyOnWriteArrayList<K> orderList = new CopyOnWriteArrayList<>();
    
    public synchronized void put(K key, V value) {
        dataMap.put(key, value);
        if (!orderList.contains(key)) {
            orderList.add(key);
        }
    }
    
    public V get(K key) {
        return dataMap.get(key);
    }
    
    public List<V> getOrderedValues() {
        return orderList.stream()
                       .map(dataMap::get)
                       .collect(Collectors.toList());
    }
}
```

### 작동 원리

1. **데이터 저장**: ConcurrentHashMap은 실제 키-값 데이터를 저장
2. **순서 유지**: CopyOnWriteArrayList는 키의 삽입 순서를 기억
3. **읽기 최적화**: 조회 작업은 락 없이 수행되어 매우 빠름
4. **쓰기 동작**: 새로운 데이터 추가 시 전체 리스트가 복사

### 장점과 단점

장점:
- 구현이 단순하고 이해하기 쉬움
- 읽기 작업이 매우 빠름
- 순서가 완벽하게 보장

단점:
- 쓰기 작업마다 리스트 전체가 복사되어 **메모리 사용량 증가**
- synchronized 블록으로 인해 **쓰기 작업**의 동시성이 제한

## 2. 버킷 기반 분할 잠금 방식

두 번째 방법은 데이터를 여러 **버킷으로 분할**하여 관리하는 접근법이다.

### 구현 방식

```java
public class BucketOrderedConcurrentMap<K, V> {
    private static final int BUCKET_COUNT = 16;
    private final OrderedBucket<K, V>[] buckets;
    
    private static class OrderedBucket<K, V> {
        private final Map<K, V> data = new LinkedHashMap<>();
        private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
        
        public void put(K key, V value) {
            lock.writeLock().lock();
            try {
                data.put(key, value);
            } finally {
                lock.writeLock().unlock();
            }
        }
        
        public V get(K key) {
            lock.readLock().lock();
            try {
                return data.get(key);
            } finally {
                lock.readLock().unlock();
            }
        }
    }
    
    public void put(K key, V value) {
        getBucket(key).put(key, value);
    }
    
    public V get(K key) {
        return getBucket(key).get(key);
    }
}
```

### 작동 원리

1. **데이터 분할**: 전체 데이터를 여러 버킷으로 나누어 관리
2. **독립적 잠금**: 각 버킷이 독립적인 읽기/쓰기 락을 보유
3. **세밀한 동시성**: 서로 다른 버킷의 데이터는 동시에 처리가 가능
4. **순서 보장**: 각 버킷 내에서는 LinkedHashMap으로 순서가 유지

### 장점과 단점

장점:
- 높은 동시성을 제공
- 메모리 사용이 효율적
- 읽기/쓰기 작업이 모두 효율적

단점:
- 구현이 복잡
- 전체 순서 조회 시 모든 버킷의 데이터를 합치고 정렬해야 함
- 해시 충돌 시 성능이 저하

## 어떤 방법을 선택해야 할까?

### 첫 번째 방법이 적합한 경우

- 읽기 작업이 쓰기보다 훨씬 많은 경우
- 데이터 크기가 작은 경우
- 구현의 단순성이 중요한 경우
- 정확한 순서 보장이 필수적인 경우

### 두 번째 방법이 적합한 경우

- 읽기와 쓰기가 모두 빈번한 경우
- 대용량 데이터를 다루는 경우
- 높은 동시성이 필요한 경우
- 메모리 효율성이 중요한 경우

## 결론

두 방법 모두 각자의 장단점이 있으며, 사용 상황에 따라 적절한 선택이 달라질 수 있다. 일반적으로는 두 번째 방법이 더 범용적이고 확장성이 높지만, 특수한 상황(읽기가 매우 많고 쓰기가 매우 적은 경우)에서는 첫 번째 방법이 더 단순하고 효과적일 수 있다. 
두 번째 방법의 경우 ConcurrentHashMap의 동작방식과 유사하기 때문에 내부 원리를 응용했다고 봐도 무방할 것 같다!
