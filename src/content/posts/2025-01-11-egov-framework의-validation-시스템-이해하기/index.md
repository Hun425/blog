---
title: "eGov Framework의 Validation 시스템 이해하기"
description: "신입 연수 마지막주차를 보내며 생긴 의문점 해소"
date: 2025-01-11
category: backend
tags: ["Java", "egov", "validation", "검증"]
cover: ./cover.png
velogUrl: https://velog.io/@chae0738/eGov-Framework%EC%9D%98-Validation-%EC%8B%9C%EC%8A%A4%ED%85%9C-%EC%9D%B4%ED%95%B4%ED%95%98%EA%B8%B0
---

연수 마지막 주차에 eGov를 사용해 개발하게 되었다.
그 중에 Validation을 걸어야하는 일이 생겼고, 평소에 하던대로 @Valid를 컨트롤러에 걸었는데 작동이 되지 않았다. 이를 해결하기 위해 공부하면서 배운 점들을 정리해보겠다.

## 1. eGov Validation vs Spring @Valid 비교

### eGov의 DefaultBeanValidator

eGov 프레임워크는 기본적으로 Apache Commons Validator를 기반으로 하는 XML 기반의 검증 시스템을 사용한다. 이는 마치 검사관이 체크리스트를 들고 각 항목을 하나씩 확인하는 것으로 비유 할 수 있다.

```xml
<!-- eGov Validation 설정 예시 -->
<form-validation>
    <formset>
        <form name="itaComVO">
            <field property="coTelno" depends="required,mask">
                <arg0 key="연락처"/>
                <var>
                    <var-name>mask</var-name>
                    <var-value>^[0-9]{2,3}[0-9]{3,4}[0-9]{4}$</var-value>
                </var>
            </field>
        </form>
    </formset>
</form-validation>
```

특징:
- 검증 규칙을 XML 파일에 집중적으로 관리
- 규칙 변경 시 Java 코드 수정 없이 XML만 수정
- 통합된 메시지 관리 가능
- 레거시 시스템과의 호환성이 좋음

### Spring의 @Valid

Spring의 Bean Validation은 JSR-380 표준을 구현한 어노테이션 기반의 검증 시스템이다. 이는 마치 자동화된 센서가 각 지점을 실시간으로 모니터링하는 것과 같다.

```java
public class ItaComVO {
    @Pattern(regexp = "^\\d{2,3}\\d{3,4}\\d{4}$", 
            message = "올바른 전화번호 형식이 아닙니다")
    private String coTelno;
    
    @NotBlank(message = "회사명은 필수 입력항목입니다")
    private String coNm;
}
```

특징:
- 검증 규칙을 도메인 객체와 함께 관리
- 타입 안전성 보장
- IDE의 지원을 받기 쉬움
- 더 현대적이고 직관적인 방식

## @Valid 오작동 원인

앞서 말한 것 처럼, **eGov**는 기본적으로 **xml**을 통한 검증 방식을 설정해놓았고, 스프링의 기본 검증 방식인 Valid에 이 설정이 덮어씌워지면서 아예 작동하지 않는 것이였다.
이를 해결하기 위해서는 **추가적인 설정**이 필요하다.



## 2. eGov에서 @Valid 사용하기

### 2.1 의존성 추가
먼저 pom.xml에 필요한 의존성을 추가해주어야 한다.

```xml
<!-- Bean Validation API -->
<dependency>
    <groupId>javax.validation</groupId>
    <artifactId>validation-api</artifactId>
    <version>2.0.1.Final</version>
</dependency>

<!-- Hibernate Validator -->
<dependency>
    <groupId>org.hibernate.validator</groupId>
    <artifactId>hibernate-validator</artifactId>
    <version>6.2.0.Final</version>
</dependency>

<!-- Expression Language -->
<dependency>
    <groupId>org.glassfish</groupId>
    <artifactId>jakarta.el</artifactId>
    <version>3.0.3</version>
</dependency>
```

### 2.2 Spring MVC 설정
/WEB-INF/config/egovframework/springmvc/egov-com-servlet.xml 파일에 다음 설정을 추가한다.

```xml
<!-- Spring MVC에서 @Valid 활성화 -->
<mvc:annotation-driven validator="springValidator"/>

<!-- JSR-303 Validator 설정 -->
<bean id="springValidator" 
      class="org.springframework.validation.beanvalidation.LocalValidatorFactoryBean"/>
```

### 2.3 컨트롤러에서 사용
이제 컨트롤러에서 @Valid를 사용할 수 있다

```java
@Controller
public class ItaComController {
    
    @RequestMapping("/itaCom/insertItaCom.do")
    public String insertItaCom(
            @Valid @ModelAttribute("itaComVO") ItaComVO itaComVO,
            BindingResult bindingResult,
            Model model) {
        
        if (bindingResult.hasErrors()) {
            return "addressbook/tma/ita/itaCom/ItaComRegister";
        }
        // 저장 로직
    }
}
```

### 2.4 JSP에서 오류 메시지 표시
JSP 페이지에서 검증 오류를 표시하는 방법:

```jsp
<form:form modelAttribute="itaComVO">
    <div>
        <label>연락처</label>
        <form:input path="coTelno"/>
        <form:errors path="coTelno" cssClass="error"/>
    </div>
</form:form>
```

## 3. 두 검증 방식의 공존

eGov 프레임워크에서는 내가 커스터마이징을 해주어야 두 가지 검증 방식을 함께 사용할 수 있다.

```java
@Controller
public class ItaComController {
    
    @Autowired
    private DefaultBeanValidator beanValidator;  // eGov validator
    
    public String insertItaCom(
            @Valid @ModelAttribute("itaComVO") ItaComVO itaComVO,  // Spring validation
            BindingResult bindingResult) {
        
        // Spring @Valid 검증
        if (bindingResult.hasErrors()) {
            return "error-view";
        }
        
        // 추가로 eGov 검증도 수행 가능
        beanValidator.validate(itaComVO, bindingResult);
        if (bindingResult.hasErrors()) {
            return "error-view";
        }
        
        // 검증 통과 후 처리
        return "success-view";
    }
}
```

## 4. 권장 사항

1. 새로운 기능 개발 시에는 @Valid 사용을 권장
   - 더 **직관적**이고 **유지보수**가 쉬움
   - IDE 지원이 우수함
   - **타입 안전성** 보장

2. **레거시 시스템** 유지보수 시에는 기존 방식 유지
   - 일관성 유지
   - 불필요한 변경 리스크 감소

3. 두 방식을 혼용할 경우 명확한 기준 설정
   - 기능별, 모듈별로 사용할 검증 방식을 명확히 구분
   - 팀 내 코딩 컨벤션으로 정립


## XML 기반 검증의 장점

1. **중앙 집중화**된 설정: 모든 검증 규칙을 한 곳에서 관리할 수 있어서 전체적인 규칙을 파악하기 쉬움. 특히 대규모 프로젝트에서 유용
2. **런타임 변경** 가능: XML 파일을 수정하면 애플리케이션을 재배포하지 않고도 검증 규칙을 변경할 수 있음.
3. 프레임워크 독립성: 특정 프레임워크에 **종속되지 않고** 독립적으로 사용할 수 있음

## XML 기반 검증의 단점

1. 복잡한 설정: XML 구성이 길어지고 복잡해질 수 있으며, **오타나 구문 오류**를 찾기 어려울 수 있음
2. **타입 안전성 부족**: XML은 컴파일 시점에 타입 체크를 할 수 없어서 런타임 에러가 발생할 위험이 있음
3. IDE 지원 제한: 현대 IDE들은 XML 기반 설정에 대한 자동완성이나 오류 검증 기능이 제한적

## @Valid 어노테이션의 장점

1. **타입 안전성**: 컴파일 시점에 오류를 발견할 수 있어 더 안정적
2. **코드 가독성**: 검증 로직이 도메인 객체와 함께 있어서 이해하기 쉽고 유지보수가 용이



이러한 장단점이 존재하지만, 결국 SI는 프로젝트에서 정해진 기술 또는 전년도 사업에 쓰던 기술을 써야한다.(그래서 레거시 한듯)
실무에서 @Valid써보는 날이 오기를 .................
