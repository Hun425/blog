---
title: "HashTable과 HashMap의 차이점"
description: "자료구조와 자바를 공부하다보면 우리는 Hash, HashTable, HashMap 등의 이름을 마주하게 된다.하지만 자바를 컬렉션에 대해서 더 깊게 공부하다보면 HashTable과 HashMap은 하는 기능은 똑같은 거 같은데 무슨 차이가 있지? 라는 생각이 들게 된다"
date: 2024-06-13
category: cs
tags: []
cover: ./cover.png
velogUrl: https://velog.io/@chae0738/HashTable%EA%B3%BC-HashMap%EC%9D%98-%EC%B0%A8%EC%9D%B4%EC%A0%90
---

<br>

자료구조와 자바를 공부하다보면 
우리는 **Hash**, **HashTable**, **HashMap** 등의 이름을 마주하게 된다.
하지만 자바를 **컬렉션**에 대해서 더 깊게 공부하다보면 
`HashTable과 HashMap은 하는 기능은 똑같은 거 같은데 무슨 차이가 있지?` 
라는 생각이 들게 된다.
오늘은 두 자료구조`정확히는 구현체`에 대해서 차이점을 자세히 알아보자.

<br>

# HashTable이란?
public class Hashtable<K,V>
    extends Dictionary<K,V>
    implements Map<K,V>, Cloneable, java.io.Serializable {
``` java
    // 해시 테이블의 버킷 배열 (트랜지언트, 직렬화되지 않음)
    private transient Entry<?,?>[] table;

    // 해시 테이블의 항목 수 (트랜지언트, 직렬화되지 않음)
    private transient int count;

    // 해시 테이블이 확장되는 임계값
    private int threshold;

    // 로드 팩터
    private float loadFactor;

    // 구조적 변경 횟수 (트랜지언트, 직렬화되지 않음)
    private transient int modCount = 0;

    // 직렬화 버전 UID
    @java.io.Serial
    private static final long serialVersionUID = 1421746759512286392L;

    // 초기 용량과 로드 팩터를 사용하는 생성자
    public Hashtable(int initialCapacity, float loadFactor) {
        if (initialCapacity < 0)
            throw new IllegalArgumentException("Illegal Capacity: " + initialCapacity);
        if (loadFactor <= 0 || Float.isNaN(loadFactor))
            throw new IllegalArgumentException("Illegal Load: " + loadFactor);

        if (initialCapacity == 0)
            initialCapacity = 1;
        this.loadFactor = loadFactor;
        table = new Entry<?,?>[initialCapacity];
        threshold = (int)Math.min(initialCapacity * loadFactor, MAX_ARRAY_SIZE + 1);
    }
    ...
}
```


- 해시테이블 클래스는 Collection 프레임 워크가 만들어지기 전부터 존재하던 자료구조이다. `자바로 해시테이블을 구현한 구현체 중에서 가장 오래됨`
- 기존 클래스와의 호환을 위해 남겨두었지만, **사용하지 않는 것**을 권장한다.
- **최신 구현 클래스**인 **HashMap**을 사용하는것을 권장한다.
- 자세한 내용은 https://velog.io/@chae0738/해시-테이블이란 에서 확인가능하다

# HashMap이란?

``` java
public class HashMap<K,V> extends AbstractMap<K,V>
    implements Map<K,V>, Cloneable, Serializable {

    @java.io.Serial
    private static final long serialVersionUID = 362498820763181265L;

    // 기본 초기 용량 - 16
    static final int DEFAULT_INITIAL_CAPACITY = 1 << 4;

    // 최대 용량 - 2^30
    static final int MAXIMUM_CAPACITY = 1 << 30;

    // 기본 로드 팩터
    static final float DEFAULT_LOAD_FACTOR = 0.75f;

    // 트리로 변환되는 버킷의 노드 수 임계값
    static final int TREEIFY_THRESHOLD = 8;

    // 리스트로 변환되는 버킷의 노드 수 임계값
    static final int UNTREEIFY_THRESHOLD = 6;

    // 트리로 변환되기 위한 최소 테이블 용량
    static final int MIN_TREEIFY_CAPACITY = 64;

    // 기본 해시 버킷 노드
    static class Node<K,V> implements Map.Entry<K,V> {
        final int hash;
        final K key;
        V value;
        Node<K,V> next;

        Node(int hash, K key, V value, Node<K,V> next) {
            this.hash = hash;
            this.key = key;
            this.value = value;
            this.next = next;
        }

        public final K getKey()        { return key; }
        public final V getValue()      { return value; }
        public final String toString() { return key + "=" + value; }
        public final int hashCode()    { return Objects.hashCode(key) ^ Objects.hashCode(value); }
        public final V setValue(V newValue) {
            V oldValue = value;
            value = newValue;
            return oldValue;
        }
        public final boolean equals(Object o) {
            if (o == this) return true;
            return o instanceof Map.Entry<?, ?> e &&
                   Objects.equals(key, e.getKey()) &&
                   Objects.equals(value, e.getValue());
        }
    }

    // 기본 생성자
    public HashMap() {
        this.loadFactor = DEFAULT_LOAD_FACTOR;
    }

    // 초기 용량과 로드 팩터를 사용하는 생성자
    public HashMap(int initialCapacity, float loadFactor) {
        if (initialCapacity < 0 || loadFactor <= 0 || Float.isNaN(loadFactor))
            throw new IllegalArgumentException();
        if (initialCapacity > MAXIMUM_CAPACITY)
            initialCapacity = MAXIMUM_CAPACITY;
        this.loadFactor = loadFactor;
        this.threshold = tableSizeFor(initialCapacity);
    }

    // 해시 함수
    static final int hash(Object key) {
        int h;
        return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
    }

    // 키와 값을 맵에 삽입
    public V put(K key, V value) {
        return putVal(hash(key), key, value, false, true);
    }

...


}

```

- 자바에서 **해시테이블을 구현한 구현체** 중에 하나이다.
- 비교적 HashTable 구현체 중에서 **최신**이다.
- 대부분의 사용법이 HashTable과 동일하다. `key-value 형태, key는 중복 불가능 등`

# HashTable과 HashMap의 차이점


### Thread-safe 여부

- HashTable -> Thread-Safe O 
- HashMap -> Thread-Safe X

### Null 값 허용 여부
- HashTable -> key값에 null값 허용 X
- HashMap -> key값에 null값 허용 O

### Enumeration 여부
- HashTable -> fail-fast Enumeration 제공
- HashMap -> Enumeration 제공 X

### 보조해시 여부
- HashTable -> 보조해시 사용 X
- HashMap -> 보조해시 사용 O `해시 충돌이 상대적으로 적음`

### 업데이트 여부
- HashTable -> 거의 업데이트 되지 않음
- HashMap -> 최근까지도 지속적으로 업데이트 중 


# 정리
- HashMap은 비동기 환경에서 주로 사용하며, Map의 인터페이스를 통해서 HashTable 자료구조를 구현한 구현체이다!

<br><br>


참고 : https://devlog-wjdrbs96.tistory.com/253
