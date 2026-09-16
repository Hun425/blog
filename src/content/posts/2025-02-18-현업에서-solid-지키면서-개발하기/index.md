---
title: "현업에서 SOLID 지키면서 개발하기"
description: "생산성과 가독성의 협의점 찾기"
date: 2025-02-18
category: backend
tags: ["Java", "SOLID"]
cover: ./cover.jpg
velogUrl: https://velog.io/@chae0738/%ED%98%84%EC%97%85%EC%97%90%EC%84%9C-SOLID-%EC%A7%80%ED%82%A4%EB%A9%B4%EC%84%9C-%EA%B0%9C%EB%B0%9C%ED%95%98%EA%B8%B0
---

## 또 다시 마주친 빨간줄 😨

평화롭게 Egov를 커스텀하던 어느 날, 콘솔창에 다시 빨간 글씨가 나타났다.

```
org.springframework.beans.factory.UnsatisfiedDependencyException: Error creating bean with name 'authUserDetailsService' ... No qualifying bean of type 'tems.core.mapper.usr.UserMapper' available
```

처음엔 '아, 이거 그냥 MyBatis 매퍼 설정 문제겠지?'라고 생각했다. 하지만 이 오류를 파고들다 보니 예상치 못한 것까지 파고들게 되었다.
이번엔 그 과정을 기록해보고자 한다.

## 삽질 1라운드: 증상 치료

기존에는 이렇게 생긴 XML 설정이 있었다

```xml
<!-- 이런 게 context-mapper.xml에 있었음 -->
<bean id="egov.sqlSession" class="org.mybatis.spring.SqlSessionFactoryBean">      
    <property name="dataSource" ref="egov.dataSource"/>
    <property name="configLocation" value="classpath:/egovframework/sqlmap/mapper-config.xml"/>
    <property name="mapperLocations">
        <list>
            <value>classpath:/tems/mapper/**/*.xml</value>
        </list>
    </property>
</bean>
```

매퍼도 그냥 심플하게 있었고

```java
// 심플한 UserMapper
public interface UserMapper {
    UserEntity findByUserid(String userid);
}
```

일단 가장 기본적인 해결방법부터 시도해봤다

```xml
<mybatis:scan base-package="tems.core.mapper"/>
```

```java
@Mapper  // 
public interface UserMapper {
    UserEntity findByUserid(String userid);
}
```

## 뭔가 이상하다... 🤔

근데 코드를 자세히 보니까 더 큰 문제가 있었다. 특히 이 부분이 눈에 띄었다.

```java
// 기존 코드
@Service
public class AuthUserDetailsService implements UserDetailsService {
    @Autowired
    private UserMapper userMapper;
    
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public UserDetails loadUserByUsername(String userid) {
        UserEntity userEntity = userMapper.findByUserid(userid);
        
        // 이게 다 한 클래스에...?
        if (userEntity == null) {
            throw new UsernameNotFoundException("User not found");
        }
        
        String rawPassword = "입력된 비밀번호";
        if (!passwordEncoder.matches(rawPassword, userEntity.getPassword())) {
            throw new UsernameNotFoundException("Invalid password");
        }

        return new User(userEntity.getUserid(),
                       userEntity.getPassword(),
                       AuthorityUtils.createAuthorityList(userEntity.getRole()));
    }
}
```

이거 보고 '아... 이래서 문제가 생겼구나' 싶었다. 
하나의 클래스가 너무 많은 일을 하고 있었던 거다.  `password 부분은 필요하지도 않음`
원래는 xml에 빈만 등록해주면 끝날 문제였지만, 
아직은 시간이 남기때문에(?) 추후 재발 방지를 목적으로 이전에 배웠던 SOLID 원칙 중 SRP(단일책임원칙)과 DIP(의존성 역전 원칙)을 적용시켜 개선해 보기로 했다.

## 개선의 여정 시작! 💪

### 1. 일단 책임을 나누자

```java
@Service
public class UserService {
    private final UserMapper userMapper;
    

    public UserService(UserMapper userMapper) {
        this.userMapper = userMapper;
    }
    // 순수한 비즈니스 로직만!
}

@Service
public class AuthUserDetailsService implements UserDetailsService {
    private final UserService userService;
    
    public AuthUserDetailsService(UserService userService) {
        this.userService = userService;
    }
    // 인증 관련된 것만!
}
```

### 2. 도메인 모델도 개선

기존에는 이런 단순한 엔티티 하나로 다 했는데

```java
// 심플했던 예전 코드
public class UserEntity {
    private Long id;
    private String userid;
    private String password;
    private String role;
}
```

이제는 역할에 맞게 분리

```java
public class User {
    // 비즈니스 정보만
}

public class SecurityUser extends User implements UserDetails {
    // 보안 관련된 것만
}
```

## 이 과정에서 배운 것들 📚

1. **겉으로 보이는 증상만 고치려고 하지 말자**
   - 처음에는 단순한 빈 주입 오류인 줄 알았는데, 파고 들어가보니 전체적인 설계가 주요 원인이였다.

2. **관심사 분리가 진짜 중요하다**
   - 하나의 클래스가 여러 가지 일을 하면... 결국 문제가 생긴다.
   - 분리하고 보니 테스트도 쉬워지고, 코드도 더 깔끔해졌다. `가독성도 상승`

3. **최신 트렌드를 따르자**
   - `@Autowired` 대신 생성자 주입
   - 명확한 책임 분리
   - 더 나은 방식들이 있다면 적극적으로 도입해보자

## 마무리

사실 처음에는 그냥 단순한 오류 해결이라고 생각했다. 
하지만 문제를 해결하다보니 전체 애플리케이션 구조를 다시 생각해보는 계기가 됐다. 
`동작하는 코드`도 중요하지만, `잘 설계된 코드`가 장기적으로 더 중요하다는 걸 다시 한번 깨달았다. 
특히나 현업에서는 **협업**이 필수이고, SI는 마감기한까지 프로젝트를 끝마쳐야 하기에 **서로의 코드를 보는 시간**과 **버그**를 줄이려면 더욱 중요하다고 느껴진다. 
바쁘다고 대충대충 짜다간 오늘과 같은 현상을 계속 만나서 **생산성**이 더 떨어질 것 같다.
**작동**과 **클린코드** 사이의 협의점을 찾는게 개발자에겐 제일 어려운 숙제가 아닐까............


### 참고한 자료들
- Spring Security 공식 문서 
- MyBatis Spring 가이드 
- Clean Architecture
