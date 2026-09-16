---
title: "가독성 좋은 코드란?"
description: "주관을 가진 코드를 작성하게 되는 과정"
date: 2026-03-30
category: backend
tags: ["kotlin", "가독성"]
cover: ./cover.png
velogUrl: https://velog.io/@chae0738/%EA%B0%80%EB%8F%85%EC%84%B1-%EC%A2%8B%EC%9D%80-%EC%BD%94%EB%93%9C%EB%9E%80-exsv51yu
---

## 들어가며

새로운 회사에 입사한지 벌써 2주가 됐다.
첫주에는 코드 분석하며 선임분께 모르는걸 많이 질문했고, 2주차부터 본격적으로 API 구현에 들어갔다.

내가 원래부터 정말 쓰고 싶었던 언어인 Kotlin이였지만 실무에서는 사용해 본 적이 없었고, 이전 회사에서는 함수형 프로그래밍은 고사하고 JAVA, JSP만 사용하다보니 정말 너무 좋으면서도 적응이 조금 느렸었다.
`퀄리티를 고려하며 짤 시간도 없었다...`

특히 JAVA를 오래 사용하다보면 코드를 가운데부터 읽는 습관이 생긴다.
반환 타입 확인하고, 메서드명 보고, 파라미터 보고, 그 다음에야 구현을 읽는 흐름.
그런데 코틀린스러운 코드를 보면 읽는 흐름이 확실히 다르다는 걸 느끼게 된다.

이번 작업에서는 단순히 기능을 구현하는 것보다, 
**"나중에 나 또는 팀원이 다시 읽었을 때 바로 이해되는 코드가 뭔가"** 를 꽤 많이 고민했다.
이 글은 그 판단 과정을 정리한 기록이다.

---

## Kotlin은 왜 같은 코드를 여러 방식으로 쓸 수 있는가

최근 채용 공고들을 보면 알겠지만, 빅테크나 유니콘 기업들은 대부분 Kotlin으로 전환하고 있다.
토스, 카카오, 당근 같은 곳들이 대표적이다. 어떤 장점이 있길래 그런 추세를 보이는 걸까??

null 안전성, 보일러플레이트 감소, 코루틴 지원 등 여러 이유가 있겠지만
이번에 직접 와닿은 건 **다양한 표현 방식**이다.

의료기기 정보 API를 구현하면서 기능 자체보다 오래 붙들게 된 지점들이 있었다.

- Kotlin에서 같은 의미를 여러 문법으로 표현할 수 있다는 점
- `expression body`와 `block body`를 언제 선택해야 읽기 좋은지
- `let`, `run`, `when`, builder DSL이 섞이면 왜 갑자기 읽기 어려워지는지
- "코틀린스럽게" 줄인 코드가 항상 더 읽기 좋은 것은 아니라는 점

Java에서는 사실 고민할 필요가 없었다. 표현 방식이 거의 하나뿐이니까.
그나마 스트림을 쓰면 선택지가 넓어지지만 SI 회사에서는 못쓰는 경우도 많다..
근데 Kotlin은 선택지가 많은 만큼, 그 선택이 가독성 차이로 직결된다.

---

## expression body(표현식) vs block body(문) 

### expression body가 잘 맞는 경우

```kotlin
override suspend fun findAll(
    request: MedicalDeviceRequest.MedicalDeviceFindAllRequest,
): MedicalDeviceResponse.MedicalDeviceFindAllResponse = medicalDeviceAppUseCase
    .findAll(
        locale = SharedGrpcContextUtil.getDisplayLocale(),
    )
    .toGrpcFindAllResp()
```
자바스크립트를 사용해봤다면 표현식, 문, 값이라는 정의를 들어봤을 것이다.
이 개념이 코틀린에서도 나온다.

위 코드는 `=` 하나로 끝나는 expression body다.
이 함수가 하는 일은 use case 호출하고, 결과를 gRPC 응답으로 변환한다.
중간 변수도 없고, 분기도 없다. 사고의 흐름이 한 번에 끝난다.

enum 변환도 마찬가지다.

```kotlin
fun MedicalDeviceItem.ContentFormat.toGrpcEnum(): MedicalDeviceContentFormat = when (this) {
    MedicalDeviceItem.ContentFormat.PLAIN_TEXT -> MEDICAL_DEVICE_CONTENT_FORMAT_PLAIN_TEXT
    MedicalDeviceItem.ContentFormat.MARKDOWN -> MEDICAL_DEVICE_CONTENT_FORMAT_MARKDOWN
}
```

`PLAIN_TEXT`면 gRPC의 `PLAIN_TEXT`, `MARKDOWN`이면 gRPC의 `MARKDOWN`.
읽는 데 1초면 충분하다.

이런 함수들의 공통점은 **"지금 값을 그대로 다른 타입으로 바꾸는"** 게 전부라는 것이다.
별다른 준비 단계 없이, 변환이 한 번에 끝나는 경우. 이럴 때 expression body가 잘 맞는다고 느꼈다.

### block body가 잘 맞는 경우

```kotlin
fun Record.toMedicalDeviceItem(): MedicalDeviceItem {
    val id = this[MEDICAL_DEVICE_ITEMS.ID]
    val sortOrder = this[MEDICAL_DEVICE_ITEMS.SORT_ORDER]
    val label = this.get("resolved_label", String::class.java) ?: ""
    val createdAt = this[MEDICAL_DEVICE_ITEMS.CREATED_AT]
    val deletedAt = this[MEDICAL_DEVICE_ITEMS.DELETED_AT]

    return when (this[MEDICAL_DEVICE_ITEMS.TYPE].toMedicalDeviceItemType()) {
        MedicalDeviceItem.Type.TEXT -> MedicalDeviceItem.Text(
            id = id,
            sortOrder = sortOrder,
            label = label,
            content = this.get("resolved_content", String::class.java) ?: "",
            contentFormat = this[MEDICAL_DEVICE_ITEMS.CONTENT_FORMAT].toMedicalDeviceContentFormat(),
            createdAt = createdAt,
            deletedAt = deletedAt,
        )

        MedicalDeviceItem.Type.DOWNLOAD_PDF -> MedicalDeviceItem.DownloadPdf(
            id = id,
            sortOrder = sortOrder,
            label = label,
            createdAt = createdAt,
            deletedAt = deletedAt,
        )
    }
}
```

이 함수는 단순한 타입 변환이 아니다.

1. 먼저 `Record`에서 공통 필드를 뽑고
2. 그다음 `TYPE`에 따라 분기해서
3. 각 subtype 객체를 만든다

이 경우 expression body로 줄일 수는 있다. 근데 줄인다고 읽기 좋아지진 않는다.
오히려 `this[...]`가 반복되면서 공통 필드가 양쪽 분기에서 중복될 뿐이다.

핵심은 **"공통 재료가 먼저 준비된다는 의도가 보이느냐"** 다.
block body에서는 `val id = ...`, `val sortOrder = ...` 로 먼저 재료를 꺼내놓고,
그 다음에 when으로 분기하는 구조가 읽는 사람 입장에서 바로 보인다.

**즉 expression body와 block body는 "줄 수" 문제가 아니라, "이 함수가 어떤 종류의 사고를 요구하느냐"의 문제다.**

---

## 흐름형 체이닝

이번에 개인적으로 가장 마음에 들었던 코드는 이거였다.

```kotlin
fun resolveDownloadUrl(
    locale: I18nLocale,
    fallbackLocale: I18nLocale,
): String? = pdfUrlsByLocale
    .filterValues { it.isNotBlank() }
    .run {
        this[locale]
            ?: this[fallbackLocale]
            ?: values.firstOrNull()
    }
```

읽는 흐름이 그냥 자연스럽다.

1. 빈 URL 제거
2. locale 우선
3. fallback locale
4. 아무거나 하나

여기서 중간 `val`을 따로 빼는 것보다, 이렇게 fallback 순서를 문장처럼 따라갈 수 있는 쪽이 더 읽기 좋았다.

이런 코드가 잘 읽히는 이유는, **같은 수준의 변환이 순서대로 이어지기 때문**이다.
"Map을 필터링하고 → 그 안에서 우선순위에 따라 하나를 꺼낸다."
추상화 레벨이 동일하다.

---

## 근데 체이닝이 항상 정답은 아니다

```kotlin
fun MedicalDeviceFindAllOutput.toGrpcFindAllResp() = items
    .map { it.toGrpcType() }
    .let { grpcItems ->
        medicalDeviceFindAllResponse {
            items.addAll(grpcItems)
        }
    }
```

이 코드를 처음 봤을 때 읽다가 한 번 끊겼다.
`items.map { ... }` 까지는 리스트 변환으로 자연스럽게 읽히는데,
갑자기 `medicalDeviceFindAllResponse { ... }` 가 나오면 "이게 뭐지?" 싶었다.

이유를 따져보면 형식 자체의 문제라기보다는, **`medicalDeviceFindAllResponse { ... }`가 builder DSL이라는 걸 몰랐기 때문**이었다.
변환 단계(map)와 생성 단계(builder)가 한 줄 체이닝 안에서 섞이면서,
익숙하지 않은 문법이 중간에 튀어나온 느낌이 들었던 거다.

물론 이 builder 패턴이 뭔지 이해하고 나면 같은 코드도 충분히 자연스럽게 읽힌다.
근데 **처음 읽는 사람 입장**에서는 아래가 더 직관적일 수 있다.

```kotlin
fun MedicalDeviceFindAllOutput.toGrpcFindAllResp() = medicalDeviceFindAllResponse {
    items.addAll(this@toGrpcFindAllResp.items.map { it.toGrpcType() })
}
```

또는 그냥 block body로 나눠도 된다.

```kotlin
fun MedicalDeviceFindAllOutput.toGrpcFindAllResp(): MedicalDeviceResponse.MedicalDeviceFindAllResponse {
    val grpcItems = items.map { it.toGrpcType() }

    return medicalDeviceFindAllResponse {
        items.addAll(grpcItems)
    }
}
```

여기서 깨달은 건, **"계속 체이닝하는 것이 무조건 좋지 않다"가 아니라, "익숙한 추상화 레벨 안에서 읽히느냐"가 더 중요하다**는 점이다.

결국 이런 코드의 선택 기준은 형식 자체가 아니라
- 팀이 protobuf Kotlin DSL에 익숙한가?
- 현재 독자가 `medicalDeviceFindAllResponse { ... }`를 "응답 생성 함수"로 바로 읽을 수 있는가?

를 기준으로 판단하는 편이 더 정확하다.

---

## let은 "코틀린스러움"을 위해 쓰는 게 아니다

### let이 필요한 경우 — nested receiver

```kotlin
fun MedicalDeviceFindAllOutput.Item.toGrpcType() = this.let { outputItem ->
    when (outputItem) {
        is MedicalDeviceFindAllOutput.Item.TextDisplay -> medicalDeviceItem {
            id = outputItem.id
            label = outputItem.label
            sortOrder = outputItem.sortOrder
            textDisplay = textDisplayAction {
                content = outputItem.content
                contentFormat = outputItem.contentFormat.toGrpcEnum()
                displayMode = outputItem.displayMode.toGrpcEnum()
            }
        }

        is MedicalDeviceFindAllOutput.Item.DownloadPdf -> medicalDeviceItem {
            id = outputItem.id
            label = outputItem.label
            sortOrder = outputItem.sortOrder
            download = downloadAction {
                url = outputItem.url
            }
        }
    }
}
```

이 코드에서 `this`를 그대로 쓰면 중첩 receiver 때문에 헷갈린다.

- 바깥 `this`는 현재 `Item`
- `medicalDeviceItem { ... }` 안쪽 `this`는 builder
- `textDisplayAction { ... }` 안쪽 `this`도 또 builder

이럴 때 `this.let { outputItem -> ... }`로 이름을 붙이면, 바깥 대상이 무엇인지 잃어버리지 않는다.
이게 `let`의 진짜 장점이라고 느꼈다.

### let이 불필요한 경우

```kotlin
fun ContentFormat.toGrpcEnum() = when (this) {
    ...
}
```

여긴 nested receiver가 없고 `this`도 하나뿐이라 굳이 이름을 다시 붙일 필요가 없다.

**결론: `let`은 "코틀린스럽게 보이려고" 쓰는 게 아니라, 현재 문맥에서 `this`가 헷갈리느냐를 기준으로 써야 한다고 느꼈다.**

---

## builder DSL이 왜 낯설게 느껴졌는가

```kotlin
medicalDeviceFindAllResponse {
    items.addAll(grpcItems)
}
```

이걸 처음 보면 이게 함수인지, 생성자인지, 클래스인지 헷갈릴 수 있다.
나도 처음에 그랬다.

실제로는 protobuf Kotlin DSL이 만들어준 **builder 함수**다.
개념적으로는 아래와 거의 같다.

```kotlin
val builder = MedicalDeviceFindAllResponse.newBuilder()
builder.items.addAll(grpcItems)
return builder.build()
```

즉 읽는 방법은
- `MedicalDeviceFindAllResponse`를 하나 만들고
- 그 안의 `items`에 `grpcItems`를 넣는다

이 builder 문법을 이해하고 나면 converter 코드가 훨씬 덜 낯설다.
Java에서 protobuf를 쓴 경험이 있는 사람이라면 `newBuilder().setXxx().build()` 패턴을 알 텐데,
Kotlin DSL은 그걸 람다 블록 형태로 감싸서 더 선언적으로 쓸 수 있게 한 거다.

근데 이걸 모르는 상태에서는 진짜 외계어처럼 보인다.

---

## 정리 

### expression body를 쓰는 경우
- 단일 변환이 순서대로 이어질 때
- 중간 변수를 따로 설명하지 않아도 될 때
- enum 변환, 단순 매핑 등

### block body를 쓰는 경우
- 공통 재료를 먼저 뽑아야 할 때
- 중간 변수의 역할이 중요할 때
- 변환 단계와 생성 단계가 섞일 때
- 디버깅 포인트를 두고 싶을 때

### 흐름형 체이닝을 쓰는 경우
- 같은 추상화 레벨의 변환이 연속될 때
- fallback 우선순위를 그대로 읽게 하고 싶을 때

### let을 쓰는 기준
- nested receiver 때문에 `this`가 헷갈릴 때만 쓴다
- 단순히 "코틀린스럽게 보이기 위해" 남용하지 않는다

### when을 쓰는 기준
- enum/sealed/type 분기에서는 적극적으로 쓴다
- if 체인보다 타입 분기가 더 잘 드러날 때 쓴다

---

## 마치며
사실 가독성이라는건 주관적이다. 
위와 같은 기준도 내가 읽을 때는 이러면 편할 것 같다는 
주관적인 기준이지 당연히 사람마다 다를것이다.

특히 expression body가 더 코틀린스럽게 보일 수 있다.
체이닝이 더 함수형처럼 보일 수 있다.
근데 **실제로 다시 읽기 쉬운지는 별개의 문제**다.

Kotlin은 같은 의미를 여러 문법으로 표현할 수 있다.
그래서 중요한 것은 "어떤 문법이 더 Kotlin답냐"가 아니라,
**이 함수가 독자에게 어떤 읽기 방식을 요구하느냐**다.

- 순서를 따라 읽게 할 것인가
- 재료를 먼저 보여줄 것인가
- 타입 분기를 먼저 드러낼 것인가
- builder를 직접 보이게 할 것인가

가독성은 문법 선택의 문제가 아니라, **읽는 사람의 사고 흐름을 어떻게 설계할 것인가의 문제**다.
이것들이 팀 컨벤션까지는 아니더라도, 유사한 특징들을 고려하고 코드를 짜게된다면
서로 리뷰할때도 훨씬 효율적일 것이라는 생각이 들었다. 

Java만 쓸 때는 이런 고민 자체가 없었다. 표현 방식이 하나뿐이니까...
Kotlin으로 넘어오면서 이런 선택의 자유가 생긴 대신, 그 선택에 대한 책임도 같이 생겼다는 걸 느꼈다.

아직 Kotlin에 완전히 익숙해진 건 아니지만,
적어도 **"더 짧은 코드"보다 "더 빨리 이해되는 코드"를 우선**하겠다는 기준은 확실히 잡힌 것 같다.
