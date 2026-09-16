---
title: "AI 페어프로그래밍의 한계"
description: "일해라 Claude"
date: 2026-04-19
category: career
tags: []
cover: ./cover.png
velogUrl: https://velog.io/@chae0738/AI-%ED%8E%98%EC%96%B4%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%EC%9D%98-%ED%95%9C%EA%B3%84
---

# 들어가며

벌써 입사한 지 한달이 지났다.
요즘은 API 개발, 라이브러리 버전 최신화, 시스템 체계화(코드리뷰 등) 등을 진행하고 있다.
그 중에서도 요즘 주요하게 시도해본게 있는데, 바로 개발 생산성을 끌어올리기 위해 Claude Code 를 꽤 적극적으로 도입해보고 있다는 것이다. 나만의 루틴이 있는데 대략 이렇다.

1. **상황과 초안 설계 입력** — 지금 풀려는 문제, 현재 코드 구조, 내가 생각한 설계안을 먼저 준다
2. **설계 첨삭** — AI 가 트레이드오프를 짚어주고 놓친 부분을 지적한다
3. **설계안 최종 정리 → 구현 위임** — 첨삭을 반영해 확정된 설계를 넘기고, 구현을 맡긴다
4. **최종 구현 확인 → 리뷰 / 문서화** — 돌아온 코드를 훑어보고 리뷰, 그리고 블로그 / 사내 문서로 남긴다

꽤 잘 굴러가는 워크플로우라고 생각했다. 
설계의 주도권은 내가 쥐고, 구현의 고된 부분만 위임하는 거니까. **속도는 기하급수적으로 빨라졌다.**
특히 선임분이 미리 각 코드레벨에서 AI를 위한 문서화를 잘 해놓으셔서 더욱 체감됐다.

근데 얼마 전, 내가 작업했던 어떤 PR 이 리뷰부터 핫픽스까지 가는 걸 겪고 나니, 다시 되돌아보게 됐다. 
기능 자체는 잘 동작하고 있었다. 테스트도 다 통과했고... 
다만 구조가 묘하게 복잡했고, 한 곳에서 한 줄이면 될 일이 여러 군데로 퍼져 있었다.

> "왜 이렇게 복잡하지? 요구사항은 분명 단순했는데...."

오늘은 그 PR 의 이야기, 그리고 그걸 복기하면서 발견한 **AI 의 과잉 설계 패턴**에 대해 써보려고 한다.

---

# 요구사항은 정말 단순했다

당시 기능 요구사항은 한 줄로 끝나는 거였다.

> "포스트 상세 화면에 '한 줄 요약' 섹션을 새로 노출한다."

기존 도메인 구조를 간단히 설명하면 이렇다. 우리 서비스에는 `Post` 라는 도메인이 있고, 하나의 `Post` 는 여러 개의 `Block` 을 가지고 있다. 상세 페이지에서는 블록이 순서대로 쭉 스크롤되는 구조다.

```kotlin
// 기존 도메인
data class Post(
    val id: PostId,
    val titleI18nKey: String,
    val category: Category,
    val blocks: List<Block>,
)

data class Block(
    val id: BlockId,
    val postId: PostId,
    val contentI18nKey: String,
    val imageUrl: String?,
    val sortOrder: Int,
)
```

이번에 요약 기능이 추가되면서, 상세 화면의 제일 마지막에 새로운 페이지로 한 줄 요약이 노출되어야 했다. 목록 화면(홈/카테고리 페이지)에서는 요약이 노출되지 **않는다.** 카드 UI 에는 제목, 카테고리, 조회 여부 정도만 들어간다.

내가 AI 에게 넘긴 입력은 대략 이랬다.

> "상세 화면에 요약 섹션을 추가해야 함. 도메인에 Summary 개념을 추가하고 상세 응답에 노출. 기존 구조 최대한 유지. + (대략적인 설계안)"

돌아온 설계와 구현을 확인하고 PR을 올렸고, 잘 돌아갔다. **그리고 하루 뒤 핫픽스가 나갔다.**

---

# 최소 변경은 어떤 모습이었어야 했나

복기하기 전에, "이상적인 최소 변경" 이 뭐였을지부터 짚어보자. 왜냐하면 이게 기준선이 있어야 뭐가 과했는지 보이기 때문이다.

세 가지만 있으면 됐다.

**하나, `Block` 에 `type` 컬럼 추가 (STI).**
기존 `post_blocks` 테이블에 이미 `content`, `image_url`, `sort_order` 같은 다형적 컬럼이 있었다. 여기에 `type` 컬럼 하나만 추가하면 `SUMMARY`, `SECTION` 같은 종류를 구분할 수 있다. 새 테이블 만들 이유 없음.

```kotlin
enum class BlockType { SECTION, SUMMARY }
```

**둘, `Post` 도메인에 `summary: Block?` nullable getter 하나.**

```kotlin
data class Post(
    val id: PostId,
    val titleI18nKey: String,
    val category: Category,
    val blocks: List<Block>,
) {
    val summary: Block? get() = blocks.firstOrNull { it.type == BlockType.SUMMARY }
    val sections: List<Block> get() = blocks.filter { it.type == BlockType.SECTION }
}
```

왜 nullable 인가? **Summary 는 상세 화면에서만 노출되는 뷰 모델 개념**이기 때문이다. 목록 조회에서는 summary 를 쿼리할 이유도, 노출할 이유도 없다. 그런 경로에서는 summary 가 "없어도" 상관없다. 이걸 도메인이 인정해야 한다.

**셋, 상세 조회 쿼리에 summary multiset 한 줄 추가.**

```kotlin
// findById 안쪽
ctx.select(
    POSTS.asterisk(),
    POST_BLOCKS_MULTISET,
    multiset(
        select(POST_BLOCKS.asterisk())
            .from(POST_BLOCKS)
            .where(POST_BLOCKS.POST_ID.eq(POSTS.ID))
            .and(POST_BLOCKS.TYPE.eq(BlockType.SUMMARY.name))
    ).`as`("post_summary"),
)
```

끝. 다른 조회 함수 (`findAllForCache`, `findAllWithViews`) 는 **건드릴 필요가 전혀 없다.** 목록과 캐시는 summary 를 쓰지 않으니까.

**총 수정 라인 수: 대충 10~20 줄 안쪽.**

---

# AI 가 실제로 한 일

이제 본론이다. AI 의 설계는 3단 구조로 과잉이었다. 각 단계를 따로 보면 **공학적으로 전부 맞는 말**이라는 게 이 이야기의 핵심이다.

## 1단계 오류 — "새 개념이니까 새 테이블"

AI 는 먼저 **새 테이블 두 개**를 만들었다.

```sql
-- AI 가 추가한 새 테이블 1
CREATE TABLE post_summaries (
    id UUID PRIMARY KEY,
    post_id UUID NOT NULL,
    text_i18n_key VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL,
);

-- AI 가 추가한 새 테이블 2
CREATE TABLE post_summary_highlights (
    id UUID PRIMARY KEY,
    summary_id UUID NOT NULL,
    text_i18n_key VARCHAR(255) NOT NULL,
    sort_order INT NOT NULL,
);
```

Summary 전용 테이블, Summary 안의 하이라이트 전용 테이블. 깔끔한 3정규화다.

문제는, **기존 `post_blocks` 테이블이 이미 다형적이었다는 것.** `content_i18n_key`, `image_url`, `sort_order` 같은 컬럼은 어떤 종류의 블록이든 담을 수 있는 구조였다. 여기에 `type` 컬럼 하나만 더 붙이면 Summary 도 같은 테이블에 담긴다 (STI — Single Table Inheritance).

AI 는 이 기존 구조의 의도를 **읽지 않았거나, 읽었어도 무시했다.** "새 개념이니까 새 테이블" 이라는 반사적 매핑을 먼저 적용한 것이다.

> 결과적으로는 리뷰 후에 선임이 이걸 STI 로 전환했다. 두 테이블은 지워지고, `post_blocks.type` 하나로 통합됐다.

## 2단계 오류 — "Summary 는 모든 Post 의 필수 속성"

이게 3단 구조의 **뿌리 오류**다.

AI 는 `Post` 도메인을 이렇게 만들었다.

```kotlin
// AI 의 버전
data class Post(
    val id: PostId,
    val titleI18nKey: String,
    val category: Category,
    val blocks: List<Block>,
    val summary: Summary,  // ← non-null 불변식
) {
    init {
        // 모든 Post 는 반드시 Summary 를 가진다
        require(summary.postId == id)
    }
}
```

`val summary: Summary` — **non-null.** 이게 말하는 바는 분명하다. "모든 Post 는 반드시 Summary 를 가진다." 이게 도메인 불변식으로 격상됐다.

하지만 현실은 뭔가? **Summary 는 상세 화면에서만 노출되는 뷰 모델 개념**이다. 목록 카드에는 Summary 가 안 들어가고, 캐시 소비자들도 Summary 를 꺼내 쓰지 않는다. Summary 의 실제 성격은 "상세 경로에 한해 노출되는 선택적 부가 정보" 에 가깝다.

그런데 AI 는 "Summary 는 중요한 도메인 개념이다" 에서 바로 "그러니까 Post 의 필수 속성이다" 로 점프했다. **이 점프를 누구도 검토하지 않았다.** 설계 단계에서 "Summary 의 지위를 어디에 둘 것인가 — 도메인 불변식인가, 뷰 모델인가?" 라는 질문을 던졌어야 했는데, 그 질문 자체가 건너뛰어졌다.

## 3단계 오류 — 쿼리: 3곳 모두에 summary multiset

2단계의 결과가 여기서 자동 전개된다.

`Post.summary` 가 non-null 이면, **Post 를 생성하는 모든 경로에서 Summary 를 공급해야 한다.** 그러니까 Post 를 반환하는 모든 조회 함수는 Summary 를 SELECT 해야 한다.

우리 코드베이스에는 Post 를 반환하는 조회 함수가 세 개 있다.

- `findById` — 상세 화면용 (여기는 Summary 진짜 필요함)
- `findAllWithViews` — 목록 카드용 (Summary 필요 없음)
- `findAllForCache` — 내부 캐시 채우기용 (소비자들이 Summary 안 씀)

AI 는 세 함수 **전부**에 summary multiset 을 추가했다. 그리고 3곳이 중복되니까, 당연히 이걸 상수로 뽑았다. **완벽하게 DRY 원칙에 맞는 리팩토링이다.**

```kotlin
@Repository
class PostRepoJooqImpl(
    private val dslContext: DSLContext,
) : PostRepo {

    override suspend fun findById(id: PostId): Post? = withSpringConnection { ctx ->
        ctx.select(
            POSTS.asterisk(),
            POST_BLOCKS_MULTISET,
            POST_SUMMARY_MULTISET,       // ← 여기 필요, OK
        )
            .from(POSTS)
            // ...
    }

    override suspend fun findAllWithViews(): List<Post> = withSpringConnection { ctx ->
        ctx.select(
            POSTS.asterisk(),
            POST_VIEW_RECORDS_MULTISET,
            POST_SUMMARY_MULTISET,       // ← 불필요, 근데 Summary 가 non-null 이라 어쩔 수 없음
        )
            .from(POSTS)
            // ...
    }

    override suspend fun findAllForCache(): List<Post> = withSpringConnection { ctx ->
        ctx.select(
            POSTS.asterisk(),
            POST_BLOCKS_MULTISET,
            POST_SUMMARY_MULTISET,       // ← 캐시 소비자 아무도 안 씀, 근데도 SELECT
        )
            .from(POSTS)
            // ...
    }

    companion object {
        // 3곳에서 공유되는 "합리적인" 상수
        private val POST_SUMMARY_MULTISET = multiset(
            select(POST_SUMMARIES.asterisk())
                .from(POST_SUMMARIES)
                .where(POST_SUMMARIES.POST_ID.eq(POSTS.ID))
        ).`as`("post_summary")
    }
}
```

각 부분만 따로 보면 다 맞다. `findById` 에서 쓰는 건 당연히 맞고, 다른 두 함수에서 쓰는 것도 "Post 가 non-null summary 를 가지니까 SELECT 안 하면 실행 에러" 라는 일관된 논리다. 상수로 뽑은 건 DRY.

**하지만 2단계의 전제가 틀렸으니, 그 위에 쌓인 "맞는 공학"은 전부 틀린 결과를 만들어낸다.** 쓸데없는 쿼리 조인이 두 곳에 늘어나고, 캐시에 쓸데없는 데이터가 들어가고, `POST_SUMMARY_MULTISET` 이라는 상수가 공유 상수의 외형으로 중앙에 자리 잡는다.

---

# 왜 이 연쇄가 일어났는가

AI 의 사고 흐름을 복기하면 대략 이렇게 전개됐을 것이다.

```
"Summary 는 중요한 도메인 개념이다."
  → (맞는 말)
"그러니 Post 의 non-null 속성이어야 한다."
  → (여기서 첫 오류. 검토되지 않은 점프)
"non-null 이려면 모든 생성 경로에서 공급해야 한다."
  → (2번이 전제라면 맞는 논리)
"모든 조회에서 SELECT 해야 한다."
  → (3번의 파생)
"세 곳이 중복되니 DRY 로 상수화한다."
  → (4번의 파생)
```

1번 외에는 전부 2번의 결정에 딸려 온 자동 전개다. **그리고 2번 단계의 결정은 설계 단계에서 가장 먼저 논의됐어야 할 "Summary 의 속성은?" 이라는 질문에 대한 답이다.** AI 는 이 질문을 무의식적으로 답하고 지나갔다. 가장 중요한 설계 결정이 암묵적으로 내려진 것이다.

---

# 나는 왜 이걸 못 걸렀나

이 부분이 나한테는 제일 뼈아팠다.

리뷰할 때 나는 분명히 코드를 봤다. 각각 이렇게 느꼈다.

- **"도메인 불변식으로 Summary 를 요구한다"** — 좋네, 모델이 엄격하게 정의되니까 안전하다
- **"모든 조회에서 SELECT 한다"** — 일관적이니까 깔끔하네
- **"공유 상수로 뽑았다"** — DRY 원칙, 당연히 맞지

**각 판단이 각각 교과서적으로 맞다.** 교과서에 나오는 좋은 설계 원칙들 `불변식 일관성 DRY` 에 하나씩 대응된다. 그러니 각 부분만 보면 통과시킬 수밖에 없다.

내가 놓친 건 이 질문이다.

> "이 불변식이 정말 도메인의 불변식인가, 아니면 특정 뷰의 요구사항을 도메인으로 끌고 올라온 건가?"

이건 각 코드 조각을 보면서 답할 수 있는 질문이 아니다. **전제를 의심해야만 답할 수 있는 질문**이다. 
내부 구현이 아니라 바깥의 경계, "이게 왜 이 위치에 있어야 하는가" 를 묻는 질문이다.

나는 그 질문을 건너뛰고 내부만 봤다. 그래서 맞아 보였다.

---

# 되돌려진 것, 살아남은 것

리뷰에서 선임분이 1단계 오류(새 테이블 2개)는 발견해주셔서 STI 로 전환했다. 두 테이블은 지워지고 `post_blocks.type` 으로 통합됐다.
**표면 증상은 많이 해결됐다.**

문제는 **2단계 오류 — `Post.summary` 의 non-null 불변식은 살아남았다는 것.** 
STI 전환을 하더라도, 도메인 모델 자체에서 `val summary: Summary` 가 non-null 로 남아있으면 여전히 모든 조회에서 공급되어야 한다. 
그래서 쿼리 3곳에 summary 를 SELECT 하는 구조가 그대로 남았고, 목록 조회에서도 불필요한 데이터가 딸려오는 상황이 이어졌다. 
결국 핫픽스가 한 번 더 들어가야 했다.


---

# 마치며 

이번 일로 알게된 점을 정리해보자면

> **AI 는 요구사항의 범위를 잘못 해석한 상태에서, 그 해석 위에 올바른 공학을 얹는다.**

AI 의 각 결정은 공학적으로 정확하다. DRY, 불변식, 공유 상수, 일관성....  교과서에 나오는 원칙들을 정석대로 적용한다. 그런데 그 모든 공학이 올바르게 작동하기 위한 **전제**가 무엇인지는 AI 가 스스로 검토하지 않는다. 물어보지 않은 질문에 혼자 답해놓고, 그 답 위에 성을 쌓는다.

리뷰어 입장에서 이게 무서운 이유는, **코드 각 부분은 다 맞아 보이기 때문**이다.코드 전체의 흐름을 알고 있지 않는다면 틀린 부분을 집어내기 어렵다. "여기 if 문 조건이 이상하다", "이 null 체크가 빠졌다" 같은 리뷰는 쉽다. 하지만 "이 불변식이 애초에 있으면 안 되는 자리에 있다" 라는 리뷰는 훨씬 어렵다. 그 판단은 코드 바깥의 맥락, 도메인, 사용자 시나리오, 다른 경로들의 요구들을 다 꿰고 있을 때만 나온다.

AI 의 성능은 기하급수적으로 오르고 있다. 같은 시간에 더 많은 코드를 만들고, 각 코드는 더 교과서적으로 맞다. 
그런데 **"이 코드가 풀어야 할 문제를 올바르게 이해했는가"** 를 판단하는 능력은 사람의 몫이고, 그 능력은 AI 발전 속도 만큼 기하급수적으로 오르지 않는다.

**AI 가 빨라질수록, 리뷰어의 질문이 바뀌어야 한다.**

전통적 질문: "이 코드가 동작하는가? 버그는 없나?"
이 시대의 질문: **"이 코드가 풀고 있는 문제가, 내가 풀라고 한 문제와 같은가? AI 가 몰래 답하고 지나간 설계 결정은 뭔가?"**

앞으로의 나한테 남기는 다짐은 간단하다. PR 을 받았을 때 제일 먼저 묻는 질문을 바꾸자. 코드를 보기 전에 먼저 묻자.

> "이 요구사항을 풀 때 AI 는 어떤 설계 결정을 암묵적으로 내렸을까? 내가 명시적으로 합의하지 않은 전제가 있는가?"

이 질문이 나와야 내부 코드를 제대로 읽을 수 있다. 각 부분이 교과서적으로 맞다는 확인은 그 다음이다.

AI 의 속도에 내 눈이 따라가지 못하면, 결국 가장 큰 비용은 이 코드를 몇 달 뒤에 건드리게 될 다음 사람이 치른다. 
그게 다음 팀원일 수도 있고, **1년 뒤의 나 자신**일 수도 있다.

## 완전한 바이브코딩이 가능할까

내가 지금 한것은 바이브 코딩 보다는 페어 프로그래밍에 가깝긴 하다.
이런것만 봐도 결국 지금의 AI로 '이거 이런 기능으로 돌아가게 해주세요'와 같은 바이브 코딩으로는 단순 MVP 모델까진 만들 수 있을지는 몰라도 
유지보수성, 확장성, 성능, 안전성을 챙긴 코드를 만들기엔 아직 부족하다고 생각한다. 
특히나 비개발자라면 더욱 그렇다.

하지만 AI를 안쓸수는 없다. 
AI는 더 발전해 나갈것이고, 그에 따라 개발자들은 어떻게 하면 더 잘 쓸 수 있는가에 대한 고민이 더욱 필요하다고 느꼈다.
앞으로는 어떻게 설계초안 프롬프트를 잘 입력하는가, 그리고 설령 AI가 잘못 구현했더라도 그것을 바로 잡을 지식이 있는가에 대한 역량은 앞으로 더욱 중요해 질 것 같다. 
다음 구현부터는 설계초안을 어떻게 하면 AI와 잘 잡을 수 있을지, 일관성 있는 코드 품질을 유지할 수 있을지를 계속 고민해봐야겠다.
