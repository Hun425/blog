---
title: "OOP vs 함수형 프로그래밍"
description: "상태 폭발에 대해서 아시나요?"
date: 2025-09-28
category: cs
tags: ["OOP", "함수형"]
cover: ./cover.jpg
velogUrl: https://velog.io/@chae0738/OOP-vs-%ED%95%A8%EC%88%98%ED%98%95
---

## 1. 배경: 지인과의 통화에서 시작된 관점 차이

최근 고민때문에 지인과 통화를 하다가, 내가 ‘함수형’을 **“명령형을 선언형으로 바꾸고, 여러 작은 함수를 연결해 신뢰성 있는 메서드를 만드는 과정”** 정도로 이해하고 있다는 이야기를 했다. 그런데 지인은 현실의 객체를 프로그램으로 나타내는 방식을 설명하면서**OOP의 추상화**와 **함수형의 세분화/명세화**를 대조하며 설명했다. 요지는 이랬다.

* **OOP 관점**: 공통 관심사를 **추상화/캡슐화**해 개발자가 복잡함을 **덜 보게** 만든다. (예: 스프링의 트랜잭션, 시큐리티 등)
* **FP 관점**: 객체의 상태를 가능한 한 **완전하게 기술**하고, 전이를 **순수 함수**로 나눠 **규칙을 코드 표면으로 끌어낸다**. 즉, “무엇이 가능하고 무엇이 금지인지”를 **타입과 분기**로 드러낸다.

이 대화가 흥미로웠던 이유는, 결국 두 세계 모두 **복잡한 상태 공간을 통제**하려는 시도라는 점이었다. 다만 OOP는 **런타임 다형성**(인터페이스/상속/상태 객체)으로, FP는 **대수적 데이터 타입(ADT)**과 **불변 전이**로 접근한다는 게 핵심 차이였다.

> 여기서 잡고 가는 개념 두 가지:
>
> * **배타(Sum)**: 같은 축 안에서는 **하나만** 고른다. 예: `Standing | Running | Jumping`
> * **독립(Product)**: 서로 다른 축들은 **동시에** 가진다. 예: `(pose, power, dir)`

---

## 2. 예시: 마리오의 상태를 어떻게 모델링할 것인가

마리오에서 상태를 나타내는걸 예시로 들어보자.

**문제 설정**

* 행동: 좌/우 이동, 점프, (꽃을 먹으면) 공격
* 제약: **점프 중 공격 불가**
* 축 나누기(단순 모델)

  * `pose ∈ {Standing | Running | Jumping}` — **배타(Sum)**
  * `power ∈ {Normal | Fire}` — **배타(Sum)**
  * `dir ∈ {Left | Right}` — **배타(Sum)** (방향 축 내부에서는 한 번에 하나)
  * 축 결합: 전체 상태 = Pose × Power × Dir — **독립(Product)** (서로 다른 축들은 함께 존재)
  * 속도 `(vx, vy)` — 연속 파라미터 (달리다 점프 = `pose=Jumping` + `vx>0`)

이제 같은 요구사항을 OOP와 FP로 나란히 스케치해보자.

### 2.1 OOP: 상태 캡슐화 + 런타임 다형성

“점프 중 공격 불가” 같은 규칙을 **해당 상태 객체의 메서드**로 감싼다.

```kotlin
// OOP-style (Kotlin)
enum class Dir { Left, Right }
sealed interface Power { object Normal: Power; object Fire: Power }

interface Pose {
    fun moveLeft(m: Mario): Mario
    fun moveRight(m: Mario): Mario
    fun jump(m: Mario): Mario
    fun attack(m: Mario): Mario // 규칙을 각 상태에서 구현
}

data class Mario(
    val pose: Pose,
    val power: Power,
    val dir: Dir,
    val vx: Double,
    val vy: Double
)

object Standing: Pose {
    override fun moveLeft(m: Mario)  = m.copy(dir = Dir.Left,  vx = -2.0)
    override fun moveRight(m: Mario) = m.copy(dir = Dir.Right, vx =  2.0)
    override fun jump(m: Mario)      = m.copy(pose = Jumping, vy = 8.0)
    override fun attack(m: Mario)    = if (m.power is Power.Fire) m else m
}

object Running: Pose {
    override fun moveLeft(m: Mario)  = m.copy(dir = Dir.Left,  vx = -4.0)
    override fun moveRight(m: Mario) = m.copy(dir = Dir.Right, vx =  4.0)
    override fun jump(m: Mario)      = m.copy(pose = Jumping, vy = 8.0)
    override fun attack(m: Mario)    = if (m.power is Power.Fire) m else m
}

object Jumping: Pose {
    override fun moveLeft(m: Mario)  = m.copy(dir = Dir.Left)
    override fun moveRight(m: Mario) = m.copy(dir = Dir.Right)
    override fun jump(m: Mario)      = m
    override fun attack(m: Mario)    = m // 점프 중 공격 = 무시
}
```

* **장점**: 규칙이 **응집**되고, 새 포즈/행동 추가 시 **다형성**으로 확장 용이.
* **주의**: 금지는 **런타임**에 드러난다(호출 자체는 가능 → 내부에서 노옵 처리).

### 2.2 FP: 불변 데이터 + 순수 전이 함수 + 패턴매칭

상태는 **값**, 전이는 **순수 함수**. 금지 규칙을 **분기**로 명시한다.

```kotlin
// FP-style (Kotlin)
sealed interface Pose { data object Standing: Pose; data object Running: Pose; data object Jumping: Pose }
sealed interface Power { data object Normal: Power;  data object Fire: Power }
enum class Dir { Left, Right }

data class Mario(
    val pose: Pose,
    val power: Power,
    val dir: Dir,
    val vx: Double,
    val vy: Double
)

fun moveLeft(m: Mario)  = m.copy(dir = Dir.Left,  vx = if (m.pose is Pose.Running) -4.0 else -2.0)
fun moveRight(m: Mario) = m.copy(dir = Dir.Right, vx = if (m.pose is Pose.Running)  4.0 else  2.0)

fun jump(m: Mario) = when (m.pose) {
    is Pose.Jumping -> m
    else            -> m.copy(pose = Pose.Jumping, vy = 8.0)
}

// “점프 중 공격 불가”가 코드 표면에 드러남
fun attack(m: Mario) = when {
    m.pose is Pose.Jumping -> m
    m.power is Power.Fire  -> m   // 발사 효과는 I/O 계층에서 처리(상태 불변)
    else                   -> m
}

// 파워 감소 같은 다른 규칙은 별도 전이로 분리 (함수형스러운 쪼개기)
fun takeHit(m: Mario) = if (m.power is Power.Fire) m.copy(power = Power.Normal) else m
```

* **장점**: 규칙이 **타입/분기**에 드러나고, **순수 함수** 덕분에 테스트가 간단.
* **주의**: 전이가 늘면 함수가 많아질 수 있다 → 이벤트 단일화(`step(state, input)`)로 정리 가능.

### 2.3 미니 테스트 (FP)

```kotlin
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class MarioFpTest {
    private fun base() = Mario(
        pose = Pose.Standing,
        power = Power.Fire,
        dir = Dir.Right,
        vx = 2.0,
        vy = 0.0
    )

    @Test
    fun `attack is ignored while jumping`() {
        val m1 = jump(base())
        val m2 = attack(m1)
        assertEquals(Pose.Jumping, m1.pose)
        assertEquals(m1, m2) // 상태 동일(불변 + 노옵)
    }
}
```

---

## 3. 실무 사례: “입수자료 → 기초자료 → 계수/인자 → 배출량” 승인 플로우

그렇다면 실무에서는 어떻게 적용 해 볼 수 있을까를 고민해보았다.
내 이전 회사 프로젝트에서는 다음과 같은 **단계적 승인(확정완료)** 규칙이 있었다.

* 다음 단계는 **직전 단계가 ‘확정완료(Confirmed)’**일 때만 가능
* **상위 단계가 변경되면**, 이후 단계들은 **자동으로 무효화(미확정)**

이 규칙을 FP와 OOP로 각각 표현해보자.

### 3.1 FP: ADT + 순수 전이 (A: 상위 자료 변경 시 자동 무효화)

```kotlin
// 1) 모델
sealed interface Step { data object Unconfirmed: Step; data object Confirmed: Step }

data class Flow(
    val intake: Step,    // 입수자료
    val base: Step,      // 기초자료
    val factors: Step,   // 계수/인자
    val emission: Step   // 배출량
)

// 2) 전이 (모두 순수함수)
fun changeIntake(f: Flow) = f.copy(
    intake = Step.Unconfirmed,
    base = Step.Unconfirmed,
    factors = Step.Unconfirmed,
    emission = Step.Unconfirmed
)

fun confirmBase(f: Flow) = if (f.intake is Step.Confirmed) f.copy(base = Step.Confirmed) else f
fun confirmFactors(f: Flow) = if (f.base is Step.Confirmed) f.copy(factors = Step.Confirmed) else f
fun confirmEmission(f: Flow) = if (f.factors is Step.Confirmed) f.copy(emission = Step.Confirmed) else f
```

**테스트**

```kotlin
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class FlowFpTest {
    private fun start() = Flow(
        intake = Step.Confirmed, // 입수 확정 가정
        base = Step.Unconfirmed,
        factors = Step.Unconfirmed,
        emission = Step.Unconfirmed
    )

    @Test
    fun `확정 경로와 상위 변경 자동 무효화`() {
        val f1 = confirmBase(start())
        val f2 = confirmFactors(f1)
        val f3 = confirmEmission(f2)
        // happy path: 단계별 확정 완료
        assertEquals(Step.Confirmed, f3.emission)

        // 상위 변경 발생 → 자동 무효화
        val f4 = changeIntake(f3)
        assertEquals(Step.Unconfirmed, f4.intake)
        assertEquals(Step.Unconfirmed, f4.base)
        assertEquals(Step.Unconfirmed, f4.factors)
        assertEquals(Step.Unconfirmed, f4.emission)
    }

    @Test
    fun `전 단계 미확정이면 다음 단계 확정 불가`() {
        val f0 = Flow(Step.Unconfirmed, Step.Unconfirmed, Step.Unconfirmed, Step.Unconfirmed)
        val f1 = confirmBase(f0)       // intake 미확정 → base 확정 실패
        val f2 = confirmFactors(f1)    // base 미확정 → factors 확정 실패
        val f3 = confirmEmission(f2)   // factors 미확정 → emission 확정 실패
        assertEquals(f0, f3)
    }
}
```

### 3.2 OOP: 정책 캡슐화 + 가변 상태

```kotlin
enum class Step { UNCONFIRMED, CONFIRMED }

data class Flow(
    var intake: Step,
    var base: Step,
    var factors: Step,
    var emission: Step
)

interface Policy {
    fun changeIntake(f: Flow) {
        f.intake = Step.UNCONFIRMED
        f.base = Step.UNCONFIRMED
        f.factors = Step.UNCONFIRMED
        f.emission = Step.UNCONFIRMED
    }
    fun confirmBase(f: Flow) { if (f.intake == Step.CONFIRMED) f.base = Step.CONFIRMED }
    fun confirmFactors(f: Flow) { if (f.base == Step.CONFIRMED) f.factors = Step.CONFIRMED }
    fun confirmEmission(f: Flow) { if (f.factors == Step.CONFIRMED) f.emission = Step.CONFIRMED }
}

object DefaultPolicy: Policy
```

**테스트**

```kotlin
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class FlowOopTest {
    private fun start() = Flow(
        intake = Step.CONFIRMED,
        base = Step.UNCONFIRMED,
        factors = Step.UNCONFIRMED,
        emission = Step.UNCONFIRMED
    )

    @Test
    fun `정책에 의해 상위 변경은 하위 자동 무효화`() {
        val p = DefaultPolicy
        val f = start()
        p.confirmBase(f); p.confirmFactors(f); p.confirmEmission(f)
        assertEquals(Step.CONFIRMED, f.emission)

        p.changeIntake(f) // 상위 변경
        assertEquals(Step.UNCONFIRMED, f.intake)
        assertEquals(Step.UNCONFIRMED, f.base)
        assertEquals(Step.UNCONFIRMED, f.factors)
        assertEquals(Step.UNCONFIRMED, f.emission)
    }
}
```

이 정도의 설계에서도 테스트 코드에서 부터 가독성의 차이가 느껴졌다. 
게다가 사이드 프로젝트에서는 테스트 코드를 쓸 때, 의존성 때문에 많은 오류가 났었는데 이것도 설계 원칙 하나로 해결된다는게 너무 편리해 보였다.
`팀에선 테스트코드가 금지되서 영원히 알 수 없을것이다..` 

---

## 4. OOP vs FP 정리

최종적으로 느낀점을 정리해보자면

* **표현 방식**

  * OOP: **상태 + 행위**를 객체 안에 담는다. 유효/무효 규칙은 **메서드 구현**으로 캡슐화된다.
  * FP: 상태는 **변하지 않는 값**, 전이는 **입력→출력 함수**. 규칙은 **타입/분기**로 명시된다.

* **검증 시점**

  * OOP: 규칙 위반은 보통 **런타임에** 드러난다(노옵, 예외, 로깅 등).
  * FP: **컴파일 타임**에 경우의 수 점검(ADT + exhaustiveness)과 **테스트**로 빠르게 피드백.

* **확장성/응집성**

  * OOP: 새로운 상태/행위가 늘어도 **다형성**으로 자연스러운 확장. 규칙이 **상태별로 응집**.
  * FP: 전이 규칙이 **한 화면에 펼쳐져** 리뷰와 리팩토링이 쉽다. 수학적 모델에 가깝다.

* **실무 감각**

  * 시스템 가장자리(입력/출력/프레임워크 결합부)는 OOP가 편한 경우가 많다.
  * 핵심 도메인 전이(순수 계산 부분)는 FP가 테스트/검증/조합 측면에서 유리하다.

---

## 5. 결론

* ‘상태 폭발’을 줄이려면, 먼저 **상태 축을 나누고**(배타 vs 독립) **규칙을 어디에 둘지** 정해야 한다.
* OOP에서 규칙은 보통 **상태 객체의 메서드**로 들어간다. FP에선 **타입/분기**와 **순수 전이**로 드러난다.
* 팀의 습관과 코드베이스에 따라 **선택의 기준**이 달라질 수 있다. 가장 중요한 건 **규칙의 위치가 일관**되고, **테스트가 빠르고 명확**한 구조를 만드는 것이다.
* 나는 앞으로도 프레임워크 바깥(핵심 도메인 계산부)에서는 **FP 스타일**을 적극 쓰되, 경계(트랜잭션, 인증, I/O)에서는 **OOP의 캡슐화**를 활용하는 하이브리드 구성을 계속 실험해볼 생각이다.`코틀린이라서 더욱 실험해볼 가치가 있는거 같다.`

결국은 어떻게 표현하느냐의 차이라고 생각한다. 코틀린이 자바임에도 불구하고 FP의 가능성을 염두에 두고 설계해둔 것은 결국 OOP와 FP의 장점을 잘 섞어서 설계하기 위한 것이라고 느껴졌다. 아직 FP에 익숙하지 않아서 많은 공부가 필요하겠지만 OOP와 함수형을 모두 공부해 둔다면 내가 제일 지향하는 가독성이 좋은 코드를 쓰기위한 발판이 될 거라고 생각한다. 

---
