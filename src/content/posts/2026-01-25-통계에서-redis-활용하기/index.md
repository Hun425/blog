---
title: "통계에서 Redis 활용하기"
description: "실시간 집계를 위한 통계 아키텍처 설계 2편"
date: 2026-01-25
category: backend
tags: ["redis"]
cover: ./cover.jpg
velogUrl: https://velog.io/@chae0738/%ED%86%B5%EA%B3%84%EC%97%90%EC%84%9C-Redis-%ED%99%9C%EC%9A%A9%ED%95%98%EA%B8%B0
---

## 들어가며

[1편](https://velog.io/@chae0738/레거시-시스템-위에서-아키텍처-설계하기)에서는 왜 Redis + PostgreSQL 이중 구조를 선택했는지에 대해 다뤘다. 이번 편에서는 본격적으로 Redis를 어떻게 활용했는지 이야기해보려 한다.

앞서 말했듯이 이 기능은 B2B 구축뿐 아니라 클라우드(DAU 7~8만)에도 적용될 예정이다. 그래서 Redis 키 설계할 때도 **"나중에 규모가 커지면 어떻게 되지?"**를 계속 생각했다.

솔직히 Redis는 캐시 용도로만 써봤지, 이렇게 "집계 엔진"처럼 쓰는 건 처음이었다. 그래서 삽질도 많이 했고, 그 과정에서 배운 것도 많았다.

---

## 1. Redis 키 설계

### 처음 생각한 단순한 구조

처음에는 이렇게 생각했다.

```
stats:{user_id}:post_cnt → "5"
stats:{user_id}:task_cnt → "3"
stats:{user_id}:comment_cnt → "12"
...
```

사용자 ID별로 각 항목을 개별 키로 관리하자. `단순하고 직관적이니까`

근데 이게 문제가 있었다.

**문제 1: 키가 너무 많아진다**

항목이 10개면 사용자 1명당 키 10개. 사용자가 1만 명이면 키 10만 개. 거기에 날짜별로 관리하면? 폭발한다.

**문제 2: 조회할 때 여러 번 호출해야 한다**

한 사용자의 통계를 다 가져오려면
```javascript
await redis.get(`stats:${userId}:post_cnt`);
await redis.get(`stats:${userId}:task_cnt`);
await redis.get(`stats:${userId}:comment_cnt`);
// ... 10번 호출
```

네트워크 왕복이 10번... 비효율적이다.

### Hash로 전환

Redis의 Hash 자료구조를 쓰면 이걸 해결할 수 있다.

```
stats:daily:20241215:PTL001:CHNL001:INTT001:user:kim123
  ├─ post_cnt: "5"
  ├─ task_cnt: "3"
  ├─ comment_cnt: "12"
  ├─ schedule_cnt: "2"
  ├─ todo_cnt: "7"
  ├─ vote_cnt: "1"
  ├─ new_chatroom_cnt: "0"
  ├─ send_message_cnt: "45"
  ├─ file_upload_cnt: "8"
  └─ file_download_cnt: "15"
```

하나의 키 안에 여러 필드를 담을 수 있다. 

장점:
- `HGETALL` 한 번으로 모든 필드 조회
- `HINCRBY`로 특정 필드만 원자적 증가
- 키 개수 대폭 감소

### 확장성 관점에서 Hash가 중요한 이유

DAU 7~8만을 생각해보자. 만약 사용자별 필드별로 개별 키를 만들면?

```
7만 명 × 10개 필드 × 30일 = 2,100만 개 키
```

Redis가 버틸 수는 있지만, 키 개수가 많아지면:
- 메모리 오버헤드 증가 (키 자체도 메모리를 먹음)
- `SCAN` 시간 증가
- 추후 확장시 클러스터 환경에서 키 분산 복잡도 증가

Hash를 쓰면?

```
7만 명 × 30일 = 210만 개 키
```

10분의 1로 줄어든다. 이 차이가 규모가 커질수록 크게 체감된다.

### 키 네이밍에 왜 저렇게 많은 정보가 들어가나?

키를 보면 좀 길다
```
stats:daily:{date}:{ptl_id}:{chnl_id}:{use_intt_id}:user:{user_id}
```

처음에는 "이거 너무 긴 거 아닐까요?"라는 의견도 들었다. 맞는 말이지만 이렇게 한 이유가 있다.

**이유 1: PostgreSQL PK와 일치시키기**

나중에 PostgreSQL로 이관할 때 이 키를 파싱하면 바로 INSERT 파라미터가 된다.

```sql
INSERT INTO admin_user_stats_daily 
  (stats_date, ptl_id, chnl_id, use_intt_id, user_id, post_cnt, ...)
VALUES 
  ('20241215', 'PTL001', 'CHNL001', 'INTT001', 'kim123', 5, ...);
```

키 설계 단계에서 이관 로직까지 고려한 것.

**이유 2: 멀티테넌트 환경**

플로우는 여러 기관이 같은 시스템을 쓴다. 기관 ID가 키에 없으면 A 기관 사용자와 B 기관 사용자의 데이터가 섞일 수 있다.

**이유 3: 날짜별 파티셔닝**

`{date}`가 키에 있으면
- TTL 관리가 쉬움 (3일 지난 키 자동 삭제)
- 특정 날짜 데이터만 조회/삭제 가능
- 배치 처리 시 "어제 날짜" 키만 스캔하면 됨

---

## 2. Hash vs Sorted Set: 용도에 따른 선택

통계 항목을 보면 크게 두 종류가 있다:

1. **카운터 형태**: 게시글 수, 댓글 수, 메시지 수 등 (숫자만 필요)
2. **목록 형태**: 신규 참여 프로젝트, 방문한 프로젝트 등 (어떤 프로젝트인지도 필요)

### 카운터는 Hash

위에서 설명한 대로 Hash의 `HINCRBY`를 쓴다.

```javascript
// 게시글 작성 시
await redis.hincrby(userHashKey, 'post_cnt', 1);

// 업무 작성 시
await redis.hincrby(userHashKey, 'task_cnt', 1);
```

원자적(atomic) 연산이라 동시에 여러 요청이 와도 카운트가 정확하다.

### 목록은 Sorted Set

"신규 참여 프로젝트"를 생각해보면, 단순히 "몇 개"가 아니라 "어떤 프로젝트에 언제 참여했는지"도 알아야 한다.

처음에는 이렇게 했다:

```javascript
// Set 사용
await redis.sadd(`${userKey}:new_projects`, projectId);
```

근데 만들어놓고 보니 문제가 생겼다.... 바로 **언제 참여했는지 알 수 없다는 것**

관리자가 팝업에서 "신규 참여 프로젝트 목록"을 보면 참여 일시도 보여줘야 하는데... Set은 값만 저장하지 메타데이터를 저장할 수 없다.

그래서 Sorted Set으로 변경했다

```javascript
// Sorted Set 사용 - score에 timestamp 저장
await redis.zadd(
  `${userKey}:new_projects`,
  'NX',                    // NX: 이미 있으면 추가 안 함
  Date.now(),              // score = 참여 시간
  projectId                // member = 프로젝트 ID
);
```

이렇게 하면
- `projectId`가 member로 저장됨 → 중복 자동 제거
- `timestamp`가 score로 저장됨 → 참여 일시 조회 가능
- `NX` 옵션 → 같은 프로젝트 여러 번 참여해도 최초 시점만 기록이 된다.

### NX 옵션을 쓴 이유

이게 은근 중요하다.

사용자가 프로젝트에 들어갔다가 나갔다가 다시 들어가면? 매번 `ZADD`가 호출된다.

- `NX` 없이: 마지막 참여 시간으로 덮어씀
- `NX` 있으면: 최초 참여 시간 유지

"신규 참여"니까 최초 시점이 의미 있기 때문에 `NX`를 썼다.

반면 "프로젝트 방문"은 다르다. 마지막으로 언제 방문했는지가 더 의미 있을 수 있다. 그래서 방문은 `NX` 없이 매번 업데이트하도록 했다.

```javascript
// 프로젝트 방문 - 매번 시간 업데이트
await redis.zadd(`${userKey}:visits`, Date.now(), projectId);
```

이런 식으로 비즈니스 요구사항에 따라 옵션을 다르게 가져갔다.

---

## 3. TTL 설정: 3일로 정한 이유

모든 Redis 키에 TTL 3일(259,200초)을 설정했다.

```javascript
await redis.expire(hashKey, 259200);
```

### 왜 하필 3일?

**배치 실패 대비**

매일 00:30에 배치가 돌면서 Redis → PostgreSQL 이관을 한다. 근데 배치가 실패하면?

- 1일 TTL: 다음 날 배치 전에 데이터 날아감 → 복구 불가
- 3일 TTL: 이틀 더 여유 있음 → 수동 복구 가능

실제로 개발하면서 테스트 할 때 배치 로직 버그로 이관이 안 된 적이 있었다. 3일 TTL 덕분에 데이터 유실 없이 수정 후 재실행할 수 있었다.

**실시간 마이그레이션과의 관계**

실시간 마이그레이션(관리자 탭 클릭 시)을 도입하면서 Redis 데이터의 수명이 더 짧아졌다. 대부분 당일에 PostgreSQL로 이관되기 때문이다.

그래도 3일을 유지한 이유는
- 주말/공휴일에 관리자가 안 들어올 수 있음
- 안전 버퍼는 넉넉한 게 좋음
- Redis 메모리? 통계 데이터 정도는 부담 없음

### TTL 갱신 타이밍

키에 값을 쓸 때마다 TTL을 갱신했다.

```javascript
await redis.hincrby(hashKey, 'post_cnt', 1);
await redis.expire(hashKey, 259200);  // 매번 갱신
```

처음 키 생성 시에만 TTL 설정하면, 활발하게 활동하는 사용자의 데이터가 중간에 날아갈 수 있다.

예를 들어
- 12월 15일 오전에 첫 활동 → TTL 설정 (12월 18일 만료)
- 12월 17일 오후에 활동 → TTL 갱신 안 하면?
- 12월 18일에 데이터 사라짐 (12월 17일 활동 포함해서)

매번 갱신하면 "마지막 활동 + 3일" 후에 만료되니까 안전하다.

---

## 4. 동시성 제어: 분산 락이 필요한 이유

### 문제 상황

실시간 마이그레이션 API가 있다. 관리자가 "사용자별 통계" 탭을 클릭하면

1. 오늘의 Redis 데이터를 PostgreSQL로 이관
2. Redis 해당 키 삭제
3. PostgreSQL에서 조회해서 응답

근데 관리자가 두 명이서 동시에 탭을 클릭하면?

```
관리자 A: Redis 읽기 → post_cnt: 5
관리자 B: Redis 읽기 → post_cnt: 5  (아직 A가 안 지움)
관리자 A: PostgreSQL에 +5 → 기존 0 + 5 = 5
관리자 A: Redis 삭제
관리자 B: PostgreSQL에 +5 → 기존 5 + 5 = 10  ← 중복!
관리자 B: Redis 삭제 (이미 없음)
```

실제 활동은 5인데 10으로 기록된다. 이런 상황을 막아야 한다.

### 해결: SET NX를 이용한 분산 락

```javascript
async function migrateNow(ptlId, chnlId, useInttId) {
  const lockKey = `lock:migrate:${ptlId}:${chnlId}:${useInttId}`;
  
  // 1. 락 획득 시도 (60초 TTL)
  const locked = await redis.set(lockKey, Date.now().toString(), 'NX', 'EX', 60);
  
  if (!locked) {
    // 다른 프로세스가 이미 마이그레이션 중
    return { skipped: true, reason: 'migration_in_progress' };
  }
  
  try {
    // 2. 마이그레이션 수행
    await doMigration(today, ptlId, chnlId, useInttId);
    return { success: true };
  } finally {
    // 3. 락 해제
    await redis.del(lockKey);
  }
}
```

`SET key value NX EX 60`의 의미
- `NX`: 키가 없을 때만 SET (이미 있으면 실패)
- `EX 60`: 60초 후 자동 만료

### 왜 Redlock 같은 거 안 썼나?

분산 락 하면 보통 Redlock 알고리즘이 떠오른다. 여러 Redis 인스턴스에서 과반수 이상 락을 획득해야 성공으로 치는 방식.

근데 우리 상황에서는 과하다고 생각했다.

**이유 1: 단일 Redis 인스턴스**

Redlock은 Redis 클러스터 환경에서 의미 있다. 우리는 아직 단일 인스턴스라 그냥 SET NX면 충분하다.

**이유 2: 락 실패해도 치명적이지 않다**

이게 핵심이다. 결제나 재고 같은 크리티컬한 데이터가 아니다. 통계가 잠깐 중복되거나, 마이그레이션이 스킵되어도

- 최악의 경우: 통계 숫자가 조금 어긋남
- 해결: 다음 배치에서 정정되거나, 관리자가 새로고침하면 됨

복잡한 락 알고리즘을 도입해서 얻는 이점보다, 단순하게 가져가고 나중에 문제가 생기면 그때 보강하는 게 낫다고 판단했다.

**이유 3: 추가 안전장치가 있다**

```javascript
// 5초 이내 재호출 스킵
const lastMigrate = await redis.get(lastKey);
if (Date.now() - lastMigrate < 5000) {
  return { skipped: true, reason: 'too_recent' };
}
```

락 외에도 "마지막 마이그레이션 후 5초 이내면 스킵" 로직을 넣었다. 관리자가 탭을 빠르게 여러 번 클릭해도 한 번만 실행된다.

### 60초 TTL의 의미

락에 TTL을 건 이유

- 마이그레이션 도중 서버가 죽으면?
- 락이 영원히 남아서 다른 요청도 영원히 블록

60초 TTL이 있으면 최악의 경우에도 1분 후 락이 풀린다.

60초로 정한 이유
- 마이그레이션이 아무리 오래 걸려도 60초는 안 넘음
- 너무 짧으면 정상 마이그레이션 중에 락이 풀릴 수 있음

---

## 5. Java GC와 분산 락?

분산 락을 공부하다 보면 "Java GC pause 때문에 락이 위험하다"는 이야기가 나온다.

예를 들어:
1. Java 서버가 락 획득
2. GC pause 발생 (수 초간 멈춤)
3. 락 TTL 만료 → 락 해제됨
4. 다른 서버가 락 획득
5. GC 끝남 → 원래 서버가 "나 아직 락 가지고 있어" 착각
6. 두 서버가 동시에 작업 → 문제 발생

이거를 걱정해야 하나 싶어서 공부를 해보았다.

**결론: 우리 구조에서는 아니다.**

왜냐하면 락을 잡는 주체가 Java(Tomcat)가 아니라 Node.js(flow-stats)이기 때문이다.

```
Java(Tomcat) → HTTP 요청 → Node.js(flow-stats) → Redis 락
```

- Java는 그냥 HTTP 요청만 보냄
- 락 관리는 Node.js에서 함
- Node.js는 싱글 스레드 + 이벤트 루프라 GC pause가 거의 없음

만약 Java에서 직접 Redis 락을 잡았다면 고민했을 텐데, 아키텍처를 분리해둔 덕에 이 문제를 자연스럽게 피했다.

---

## 6. 키 스캔 전략: SCAN vs KEYS

배치에서 "어제 날짜의 모든 사용자 통계"를 가져와야 한다.

### KEYS는 쓰면 안 된다

```javascript
// 절대 이렇게 하면 안 됨
const keys = await redis.keys('stats:daily:20241215:*');
```

`KEYS` 명령어는 전체 키를 스캔한다. 키가 100만 개면? Redis가 그 동안 블로킹된다. 운영 환경에서 쓰면 장애 난다.

### SCAN을 써야 한다

```javascript
async function scanKeys(pattern) {
  const keys = [];
  let cursor = '0';
  
  do {
    const [newCursor, foundKeys] = await redis.scan(
      cursor,
      'MATCH', pattern,
      'COUNT', 1000
    );
    cursor = newCursor;
    keys.push(...foundKeys);
  } while (cursor !== '0');
  
  return keys;
}

// 사용
const yesterdayKeys = await scanKeys('stats:daily:20241214:*:user:*');
```

`SCAN`은
- 커서 기반으로 조금씩 가져옴
- Redis 블로킹 없음
- 다만 여러 번 호출해야 해서 조금 느림

배치는 새벽에 도니까 조금 느려도 상관없다. 운영 환경 안정성이 더 중요하다고 생각했다.

### 키 설계가 스캔을 쉽게 한다

아까 키 네이밍이 왜 길었는지 설명했었다.

```
stats:daily:{date}:{ptl_id}:{chnl_id}:{use_intt_id}:user:{user_id}
```

이 덕분에 스캔 패턴이 깔끔하다.

```javascript
// 어제 날짜, 특정 기관의 모든 사용자
`stats:daily:20241214:PTL001:CHNL001:INTT001:user:*`

// 어제 날짜, 모든 기관의 모든 사용자
`stats:daily:20241214:*:user:*`

// 특정 사용자의 모든 날짜 (이건 안 됨 - 중간에 와일드카드)
`stats:daily:*:*:*:*:user:kim123`  // 비효율적
```

키 설계할 때 "나중에 어떤 패턴으로 스캔할 것인가"를 미리 고민해야 한다.

---

## 7. 이 글을 마치며

2편에서는 Redis 키 설계와 동시성 제어에 대해 다뤘다.

정리하면:

| 결정 | 이유 | 확장성 관점 |
|------|------|------------|
| Hash 사용 | 여러 필드를 하나의 키로 관리 | 키 개수 10분의 1로 감소 |
| Sorted Set (NX) | 중복 제거 + timestamp 저장 | - |
| 키에 PK 정보 포함 | PostgreSQL 이관 시 파싱 용이 | 멀티테넌트 격리 |
| TTL 3일 | 배치 실패 대비 + 안전 버퍼 | 메모리 관리 |
| SET NX 락 | 단순하고 충분함 | 단일 인스턴스 기준 |
| SCAN 사용 | KEYS는 운영 환경에서 금지 | 대용량에서 필수 |

설계하면서 계속 생각한 건 **"지금 당장의 요구사항"**과 **"나중에 클라우드에 갔을 때"**의 균형이었다.

예를 들어
- 분산 락은 지금 SET NX로 충분하지만, 나중에 Redis 클러스터로 가면 Redlock 검토 필요
- SCAN은 지금도 쓰고 있지만, 키가 수백만 개가 되면 배치 시간 최적화 필요
- Hash 구조 덕분에 키 개수는 관리 가능한 수준 유지

Redis를 단순 캐시가 아니라 "실시간 집계 엔진"으로 쓰면서 많이 배웠다. Hash, Sorted Set, TTL, 분산 락... 각각은 알고 있었는데 실제 프로젝트에서 조합해서 쓰니까 고려할 게 정말 많았다.

다음 편에서는 배치와 실시간 마이그레이션 이중 구조에 대해 다뤄보겠다. 왜 둘 다 필요했는지, UPSERT 전략은 어떻게 다른지, 마이그레이션 후 Redis 데이터를 왜 삭제하는지 등을 정리해볼 예정이다.
