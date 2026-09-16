---
title: "N+1 문제 마스터하기"
description: "JPA 마스터에 한걸음 다가서기"
date: 2025-05-13
category: cs
tags: ["JPA", "n+1"]
cover: ./img-01.png
velogUrl: https://velog.io/@chae0738/N1-%EB%AC%B8%EC%A0%9C-%EB%A7%88%EC%8A%A4%ED%84%B0%ED%95%98%EA%B8%B0
---

## 들어가며

포트폴리오를 정리하는 과정에서 과거 프로젝트들의 성능 이슈를 돌아보게 되었다. 특히 JPA를 활용한 여러 프로젝트에서 반복적으로 마주쳤던 **N+1 문제**와 **카르테시안 곱** 현상이 눈에 띄었다. 이때는 단순히 페치 전략(Fetch Strategy)만 조정하면 해결될 것이라 생각했지만, 이번에 정리하면서 공부해보니 실제로는 다양한 사용 시나리오마다 최적화 접근법이 달라야 한다는 사실을 깨달았다.

이 글에서는 **JPA 성능 이슈**의 **근본 원인**부터 실전에서 검증된 해결책까지, 내가 경험하고 학습한 내용을 체계적으로 정리했다. 단순한 이론보다는 실제 코드와 함께 각 최적화 기법의 장단점을 분석하고, 어떤 상황에서 어떤 방법이 최적인지 소개하고자 한다.

## 1. N+1 문제와 카르테시안 곱의 본질 이해

### 1.1 N+1 문제: 연쇄 쿼리 폭발의 원인

#### 문제 상황

게시판 시스템에서 게시글과 댓글을 조회하는 간단한 상황을 가정해보자. 다음과 같은 엔티티 관계가 있다고 가정한다.

```java
@Entity
public class Post {
    @Id @GeneratedValue
    private Long id;
    
    private String title;
    private String content;
    
    @OneToMany(mappedBy = "post", fetch = FetchType.LAZY)
    private List<Comment> comments = new ArrayList<>();
    
    // getter, setter 생략
}

@Entity
public class Comment {
    @Id @GeneratedValue
    private Long id;
    
    private String content;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id")
    private Post post;
    
    // getter, setter 생략
}
```

다음과 같은 코드로 게시글 목록과 각 게시글의 댓글 수를 조회한다고 가정해보자:

```java
@Service
@Transactional(readOnly = true)
public class PostService {
    
    private final PostRepository postRepository;
    
    public List<PostSummaryDto> getPostsWithCommentCount() {
        List<Post> posts = postRepository.findAll();
        
        return posts.stream()
            .map(post -> new PostSummaryDto(
                post.getId(),
                post.getTitle(),
                post.getComments().size()  // 여기서 N+1 문제 발생!
            ))
            .collect(Collectors.toList());
    }
}
```

#### 문제 원인

위 코드를 실행하면 다음과 같은 SQL이 실행된다.

1. 모든 게시글을 조회하는 쿼리 1번

```sql
SELECT * FROM post;
```

2. 각 게시글마다 연관된 댓글을 조회하는 쿼리 N번

```sql
SELECT * FROM comment WHERE post_id = ?; -- 게시글 개수(N)만큼 반복 실행
```

이것이 바로 **N+1 문제**의 전형적인 예시다. 최초 부모 엔티티 조회 쿼리 1번과 각 부모 엔티티의 자식 엔티티를 조회하는 N번의 쿼리가 추가로 발생하여, 총 N+1번의 데이터베이스 쿼리가 실행된다.

#### 발생 원인

N+1 문제는 JPA의 지연 로딩(LAZY) 전략과 밀접한 관련이 있다.

1. **지연 로딩(LAZY)의 작동 원리**: 연관 엔티티는 실제로 접근하는 시점에 데이터베이스에서 로딩된다.
2. **프록시 객체**: JPA는 지연 로딩을 구현하기 위해 프록시 객체를 사용한다.
3. **최초 접근 시점**: 프록시 객체의 메서드가 처음 호출될 때 실제 데이터베이스 쿼리가 발생한다.

위 예제에서 `post.getComments().size()`를 호출할 때마다 별도의 SQL이 실행되어, 성능 저하의 원인이 된다.

### 1.2 카르테시안 곱: 데이터 폭발의 원인

#### 문제 상황

N+1 문제를 해결하기 위해 단순히 FETCH JOIN을 적용했을 때 발생하는 문제를 살펴보자.

```java
@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    
    @Query("SELECT p FROM Post p JOIN FETCH p.comments")
    List<Post> findAllWithComments();
}
```

위 코드를 실행하면 다음과 같은 SQL이 생성된다.

```sql
SELECT p.*, c.* 
FROM post p 
INNER JOIN comment c ON p.id = c.post_id
```

#### 문제 원인

이 쿼리의 결과는 어떻게 될까? 만약 하나의 게시글에 3개의 댓글이 있다면, 해당 게시글은 결과 집합에 3번 중복해서 나타난다. 이것이 바로 **카르테시안 곱(Cartesian Product)** 문제다.

예를 들어, 다음과 같은 데이터가 있다고 가정해보자.

- Post 1: "이직은 어떻게 하나요?" (댓글 3개)
- Post 2: "저도 알려주세요" (댓글 2개)

JOIN FETCH 쿼리 결과는 다음과 같이 5개 행이 반환된다:

1. Post 1 + Comment 1![](./img-01.png)

2. Post 1 + Comment 2
3. Post 1 + Comment 3
4. Post 2 + Comment 1
5. Post 2 + Comment 2

Hibernate는 영속성 컨텍스트에서 중복된 엔티티를 자동으로 필터링하여 최종적으로는 2개의 Post 객체를 반환하지만, 데이터베이스에서 애플리케이션으로 전송되는 데이터의 양은 5배로 증가한다.

더 심각한 것은 여러 컬렉션을 JOIN FETCH로 함께 가져오려 할 때 발생한다. 예를 들어, Post가 Comment와 Tag 두 개의 컬렉션을 가지고 있다면 결과 행 수는 `댓글 수 × 태그 수`만큼 폭발적으로 증가한다.

## 2. 최적화 기법

### 2.1 Fetch Join: 가장 직관적인 해결책

#### 기본 개념

Fetch Join은 JPQL에서 연관 엔티티를 함께 조회하도록 지시하는 기능으로, N+1 문제를 해결하는 가장 직관적인 방법이다.

```java
@Query("SELECT p FROM Post p JOIN FETCH p.comments WHERE p.id = :id")
Optional<Post> findByIdWithComments(@Param("id") Long id);
```

#### 장점

- 단일 SQL로 모든 데이터 조회 가능
- 구현이 간단하고 직관적
- 즉시 사용 가능한 완전한 객체 그래프 제공

#### 한계와 주의점

1. **카르테시안 곱 발생**: 앞서 설명한 것처럼 컬렉션 조인 시 결과 행이 증가한다.
2. **중복 데이터**: DISTINCT 키워드로 일부 해결 가능하지만 네트워크 전송량은 여전히 많다.
    
    ```java
    @Query("SELECT DISTINCT p FROM Post p JOIN FETCH p.comments")List<Post> findAllWithComments();
    ```
    
3. **다중 컬렉션 조인 불가**: 두 개 이상의 컬렉션을 Fetch Join하면 예상치 못한 결과가 발생한다.
4. **페이징 불가**: 컬렉션 Fetch Join과 페이징을 함께 사용하면 메모리에서 페이징이 수행되어 성능 이슈가 발생한다.

### 2.2 Entity Graph: 더 유연한 접근법

#### 기본 개념

Entity Graph는 JPA 2.1에서 도입된 기능으로, 엔티티를 조회할 때 함께 로딩할 속성을 지정할 수 있다.

```java
@NamedEntityGraph(
    name = "Post.withComments",
    attributeNodes = {
        @NamedAttributeNode("comments")
    }
)
@Entity
public class Post {
    // 엔티티 내용
}
```

```java
@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    
    @EntityGraph(value = "Post.withComments")
    List<Post> findAll();
    
    // 또는 메서드별로 EntityGraph 정의
    @EntityGraph(attributePaths = {"comments"})
    Optional<Post> findById(Long id);
}
```

#### 장점

- 선언적 방식으로 조회 전략 정의 가능
- 런타임에 유연하게 적용 가능
- 재사용 가능한 그래프 정의

#### 주의점

- FETCH 타입과 LOAD 타입의 차이 이해 필요
    - FETCH: 그래프에 명시된 속성은 EAGER, 나머지는 LAZY
    - LOAD: 그래프에 명시된 속성은 EAGER, 나머지는 기본 Fetch 모드 유지
- 여전히 컬렉션 조회 시 카르테시안 곱 발생
- 다중 컬렉션 및 페이징 제약은 Fetch Join과 동일

### 2.3 @BatchSize: 배치 로딩으로 쿼리 수 줄이기

#### 기본 개념

@BatchSize는 지연 로딩 시 한 번에 여러 엔티티를 조회하도록 지시하는 기능이다.

```java
@Entity
public class Post {
    // 기타 필드

    @BatchSize(size = 50)
    @OneToMany(mappedBy = "post", fetch = FetchType.LAZY)
    private List<Comment> comments = new ArrayList<>();
}
```

또는 글로벌 설정으로 적용할 수도 있다:

```yaml
# application.yml
spring:
  jpa:
    properties:
      hibernate:
        default_batch_fetch_size: 50
```

#### 작동 원리

@BatchSize가 적용되면 N+1 문제가 다음과 같이 변화한다:

1. 모든 게시글을 조회하는 쿼리 1번

```sql
SELECT * FROM post;
```

2. 여러 게시글의 댓글을 한 번에 조회하는 쿼리 ⌈N/배치사이즈⌉번

```sql
SELECT * FROM comment WHERE post_id IN (?, ?, ... ?); -- 최대 배치사이즈만큼의 ID
```

만약 게시글이 100개이고 배치 사이즈가 50이라면, 총 쿼리 수는 N+1=101개에서 1+⌈100/50⌉=3개로 줄어든다.

#### 장점

- 구현이 매우 간단 (어노테이션 하나 추가)
- 페이징과 함께 사용 가능
- 다중 컬렉션에도 적용 가능
- 카르테시안 곱 문제 없음

#### 한계

- 완전한 N+1 해결은 아님 (줄이는 것)
- 최적의 배치 사이즈 결정이 필요 (너무 작으면 효과 감소, 너무 크면 IN 절이 과도하게 커짐)

### 2.4 서브셀렉트 페치: 컬렉션 효율적으로 로딩하기

#### 기본 개념

서브셀렉트 페치는 연관 컬렉션을 조회할 때 서브쿼리를 사용하는 방식이다.

```java
@Entity
public class Post {
    // 기타 필드

    @Fetch(FetchMode.SUBSELECT)
    @OneToMany(mappedBy = "post", fetch = FetchType.LAZY)
    private List<Comment> comments = new ArrayList<>();
}
```

#### 작동 원리

서브셀렉트 페치가 적용되면 다음과 같은 쿼리가 실행된다:

1. 모든 게시글을 조회하는 쿼리 1번

```sql
SELECT * FROM post;
```

2. 조회된 모든 게시글의 댓글을 한 번에 가져오는 서브쿼리 1번

```sql
SELECT * FROM comment 
WHERE post_id IN (SELECT id FROM post WHERE ...);
```

#### 장점

- N+1 문제를 1+1 쿼리로 해결
- 카르테시안 곱 방지
- 컬렉션을 효율적으로 로딩
- 페이징과 함께 사용 가능

#### 한계

- 항상 전체 컬렉션을 로딩 (필요 없는 데이터도 가져옴)
- 다른 최적화 기법과 충돌 가능성
- 상황에 따라 비효율적일 수 있음 (조회 결과가 적은데 서브쿼리가 복잡한 경우)

### 2.5 DTO 프로젝션: 필요한 데이터만 정확히 조회하기

#### 기본 개념

엔티티 전체가 아닌 필요한 데이터만 DTO로 직접 조회하는 방식이다.

```java
public interface PostRepository extends JpaRepository<Post, Long> {
    
    @Query("SELECT new com.example.dto.PostSummaryDto(p.id, p.title, SIZE(p.comments)) " +
           "FROM Post p")
    List<PostSummaryDto> findAllPostSummaries();
}
```

```java
public class PostSummaryDto {
    private Long id;
    private String title;
    private int commentCount;
    
    // 생성자, getter, setter
    public PostSummaryDto(Long id, String title, int commentCount) {
        this.id = id;
        this.title = title;
        this.commentCount = commentCount;
    }
}
```

#### QueryDSL을 활용한 DTO 프로젝션

QueryDSL을 사용하면 더 유연하게 DTO 프로젝션을 구현할 수 있다.

```java
@Repository
@RequiredArgsConstructor
public class PostCustomRepositoryImpl implements PostCustomRepository {
    
    private final JPAQueryFactory queryFactory;
    
    @Override
    public List<PostSummaryDto> findAllPostSummaries() {
        QPost post = QPost.post;
        
        return queryFactory
            .select(Projections.constructor(
                PostSummaryDto.class,
                post.id,
                post.title,
                post.comments.size()
            ))
            .from(post)
            .fetch();
    }
}
```

#### 장점

- 필요한 데이터만 정확히 조회 (네트워크 및 메모리 효율)
- SQL 최적화 용이
- 복잡한 조인과 계산을 쿼리 레벨에서 처리
- 영속성 컨텍스트 부담 감소

#### 한계

- 엔티티가 아닌 DTO이므로 영속성 컨텍스트에서 관리되지 않음
- 코드 중복 가능성 (유사한 DTO 클래스들)
- 도메인 로직과 표현 로직 경계가 모호해질 수 있음

## 3. 페이징 이슈 해결 여정

### 3.1 Fetch Join과 페이징을 동시에?

#### 문제 상황

컬렉션을 Fetch Join하면서 페이징을 함께 사용할 때 발생하는 문제를 살펴보자.

```java
@Query("SELECT DISTINCT p FROM Post p JOIN FETCH p.comments")
Page<Post> findAllWithComments(Pageable pageable); // 위험한 코드!
```

이 코드를 실행하면 Hibernate는 다음과 같은 경고를 출력한다:

```
HHH000104: firstResult/maxResults specified with collection fetch; applying in memory!
```

#### 문제 원인

1. **메모리 페이징**: Hibernate는 컬렉션 Fetch Join 시 SQL 레벨의 페이징을 비활성화하고, 모든 데이터를 메모리로 로드한 후 애플리케이션에서 페이징을 수행한다.
2. **성능 저하**: 전체 데이터를 메모리로 로드하므로 대량의 데이터에서 심각한 성능 문제가 발생한다.
3. **메모리 부담**: 1차 캐시에 많은 엔티티가 로드되어 메모리 사용량이 증가하고 GC 부담이 커진다.

### 3.2 해결책: 2단계 페이징 패턴

#### 패턴 구현

2단계 페이징 패턴은 다음과 같은 순서로 구현한다.

1. 1단계: 부모 엔티티의 ID만 페이징하여 조회
2. 2단계: 조회된 ID 목록으로 IN 절을 사용해 Fetch Join 수행

```java
@Repository
@RequiredArgsConstructor
public class PostCustomRepositoryImpl implements PostCustomRepository {
    
    private final EntityManager em;
    
    @Override
    public List<Post> findAllWithCommentsUsingPaging(Pageable pageable) {
        // 1단계: ID만 페이징하여 조회
        List<Long> postIds = em.createQuery(
                "SELECT p.id FROM Post p ORDER BY p.createdDate DESC", Long.class)
            .setFirstResult((int) pageable.getOffset())
            .setMaxResults(pageable.getPageSize())
            .getResultList();
        
        if (postIds.isEmpty()) {
            return Collections.emptyList();
        }
        
        // 2단계: 조회된 ID로 Fetch Join 수행
        return em.createQuery(
                "SELECT DISTINCT p FROM Post p " +
                "JOIN FETCH p.comments " +
                "WHERE p.id IN :postIds " +
                "ORDER BY p.createdDate DESC", Post.class)
            .setParameter("postIds", postIds)
            .getResultList();
    }
    
    @Override
    public long countPosts() {
        return em.createQuery("SELECT COUNT(p) FROM Post p", Long.class)
            .getSingleResult();
    }
}
```

#### 장점

- SQL 레벨 페이징 유지 (성능 향상)
- 메모리 효율성 (필요한 데이터만 로드)
- N+1 문제 해결
- 카르테시안 곱 최소화

#### 구현 시 주의점

- ID 조회와 본 조회의 정렬 조건 일치 필요
- 페이지 정보(전체 개수 등) 별도 조회 필요
- QueryDSL을 활용하면 더 깔끔한 구현 가능

```java
@Repository
@RequiredArgsConstructor
public class PostCustomRepositoryImpl implements PostCustomRepository {
    
    private final JPAQueryFactory queryFactory;
    
    @Override
    public List<Post> findAllWithCommentsUsingPaging(Pageable pageable) {
        QPost post = QPost.post;
        
        // 1단계: ID만 페이징하여 조회
        List<Long> postIds = queryFactory
            .select(post.id)
            .from(post)
            .offset(pageable.getOffset())
            .limit(pageable.getPageSize())
            .orderBy(post.createdDate.desc())
            .fetch();
        
        if (postIds.isEmpty()) {
            return Collections.emptyList();
        }
        
        // 2단계: 조회된 ID로 Fetch Join 수행
        return queryFactory
            .selectFrom(post)
            .join(post.comments).fetchJoin()
            .where(post.id.in(postIds))
            .orderBy(post.createdDate.desc())
            .distinct()
            .fetch();
    }
}
```


## 4. 추천 표준 패턴 정리

지금까지 살펴본 다양한 최적화 기법을 바탕으로, 상황별 최적의 패턴을 정리해보자.

### 4.1 상세 조회: JOIN FETCH + DISTINCT

단일 엔티티의 상세 정보와 연관 엔티티를 함께 조회할 때는 JOIN FETCH가 가장 효과적이다.

```java
@Query("SELECT DISTINCT p FROM Post p " +
       "JOIN FETCH p.comments " +
       "WHERE p.id = :id")
Optional<Post> findByIdWithComments(@Param("id") Long id);
```

**적용 시나리오**:

- 게시글 상세 화면
- 주문 상세 정보
- 사용자 프로필 조회

### 4.2 목록 조회 + 페이징: 2단계 페이징 + Fetch Join

목록 조회와 페이징이 필요한 경우는 2단계 페이징 패턴이 최적이다.

```java
// 1단계: ID 페이징 조회
List<Long> ids = em.createQuery("SELECT p.id FROM Post p ORDER BY p.id DESC", Long.class)
    .setFirstResult(offset)
    .setMaxResults(limit)
    .getResultList();

// 2단계: ID로 전체 데이터 조회
List<Post> posts = em.createQuery(
        "SELECT DISTINCT p FROM Post p " +
        "JOIN FETCH p.comments " +
        "WHERE p.id IN :ids " +
        "ORDER BY p.id DESC", Post.class)
    .setParameter("ids", ids)
    .getResultList();
```

**적용 시나리오**:

- 게시글 목록 (댓글 수 표시)
- 상품 목록 (리뷰 정보 포함)
- 주문 내역 (주문 상품 정보 포함)

### 4.3 대용량 컬렉션: @BatchSize 또는 @Fetch(FetchMode.SUBSELECT)

대용량 컬렉션을 효율적으로 로딩해야 할 때는 BatchSize나 서브셀렉트가 효과적이다.

```java
// 엔티티에 직접 설정
@Entity
public class Post {
    // 다른 필드들...
    
    @BatchSize(size = 50)
    // 또는 @Fetch(FetchMode.SUBSELECT)
    @OneToMany(mappedBy = "post", fetch = FetchType.LAZY)
    private List<Comment> comments = new ArrayList<>();
}

// 또는 글로벌 설정으로 적용
// application.yml에 추가:
// spring.jpa.properties.hibernate.default_batch_fetch_size: 50
```

**적용 시나리오**:

- 대량의 댓글이 있는 게시판
- 많은 주문 상품이 있는 주문 내역
- 다수의 태그가 있는 콘텐츠 관리

### 4.4 읽기 전용 통계: DTO 프로젝션 (+ QueryDSL)

통계 데이터 조회나 읽기 전용 요약 정보는 DTO 프로젝션이 최적이다.

```java
// JPQL로 구현
@Query("SELECT new com.example.dto.PostStatDto(" +
       "p.category, COUNT(p), AVG(p.viewCount)) " +
       "FROM Post p GROUP BY p.category")
List<PostStatDto> getPostStatsByCategory();

// QueryDSL로 구현
@Override
public List<PostStatDto> getPostStatsByCategory() {
    QPost post = QPost.post;
    
    return queryFactory
        .select(Projections.constructor(
            PostStatDto.class,
            post.category,
            post.count(),
            post.viewCount.avg()
        ))
        .from(post)
        .groupBy(post.category)
        .fetch();
}
```

**적용 시나리오**:

- 대시보드 통계
- 리포트 생성
- API 응답 최적화

## 마치며

이 글에서는 JPA 성능 이슈의 근본 원인인 N+1 문제와 카르테시안 곱 현상을 살펴보고, 다양한 최적화 기법을 코드 예제와 함께 분석했다. 각 기법의 장단점을 이해하고 적절한 상황에 적용하는 것이 중요할 것 같다.

실무에서는 한 가지 기법보다는 여러 최적화 패턴을 상황에 맞게 조합해서 사용하는 것이 효과적일 것이다. 특히 **2단계 페이징 + Fetch Join** 패턴은 페이징이 필요한 목록 조회에서 가장 널리 사용되는 방식으로, N+1 문제와 카르테시안 곱을 동시에 해결한다. 

마지막으로 성능 최적화는 항상 측정과 검증이 필요하다. 로그를 통해 실제 발생하는 SQL을 확인하고, 성능 테스트를 통해 최적화 효과를 검증하는 습관을 들이는 것이 중요하다는 걸 다시한번 깨달았다. 이러한 과정을 통해 JPA의 장점을 최대한 활용하면서도 성능 문제를 효과적으로 관리할 수 있지 않을까.. 생각해보며 글을 마친다

## 참고자료

[Hibernate 관련 공식 튜토리얼 사이트]([Baeldung - N+1 Problem in Hibernate and Spring Data JPA](https://www.baeldung.com/spring-hibernate-n1-problem))
[스택 오버플로우 N+1 질문 답변](https://stackoverflow.com/questions/32453989/what-is-the-solution-for-the-n1-issue-in-jpa-and-hibernate)
[Hibernate 공식 문서](https://docs.jboss.org/hibernate/orm/current/userguide/html_single/Hibernate_User_Guide.html#fetching)
