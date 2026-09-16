---
title: "자원이 무한하다면 DB커넥션 풀은 필요없을까?"
description: "DB 커넥션 풀이 필요한 이유"
date: 2025-06-24
category: backend
tags: []
cover: ./cover.gif
velogUrl: https://velog.io/@chae0738/%EC%9E%90%EC%9B%90%EC%9D%B4-%EB%AC%B4%ED%95%9C%ED%95%98%EB%8B%A4%EB%A9%B4-DB%EC%BB%A4%EB%84%A5%EC%85%98-%ED%92%80%EC%9D%80-%ED%95%84%EC%9A%94%EC%97%86%EC%9D%84%EA%B9%8C
---

## 들어가며

최근들어 면접 때문에 준비할게 많아졌고, 블로그에 정리할 물리적인 시간이 많이 부족했었다. 
아직도 시간이 많이 부족한 시기이지만 면접에서 들었던 질문과 내가 몰랐던 질문을 정리하고자 이번 글을 쓰게 되었다. 

## 커넥션 풀이란?

개발을 하다 보면 '커넥션 풀'이라는 단어를 당연하게 사용하곤 한다. 스프링 부트(Spring Boot)에서는 HikariCP가 기본으로 탑재되어 있고, 우리는 그저 application.yml 파일에 몇 가지 속성을 설정하는 것만으로 강력한 커넥션 풀의 이점을 누린다.

하지만 이 당연함 이면에 숨겨진 원리를 깊이 생각해 본 적이 나는 없다. `왜 커넥션 풀은 반드시 필요한가?` 라는 질문에서 시작해, `만약 CPU와 메모리가 무한하다면 커넥션 풀은 없어도 되지 않을까?` 라는 극단적인 질문까지 파고들어 그 본질을 정리해 보았다.

## 커넥션 풀이 없다면

먼저 커넥션 풀이 없는 환경을 상상해 보자. 사용자의 요청이 들어와 데이터베이스에 접근해야 할 때마다 애플리케이션은 다음과 같은 고비용의 작업을 순서대로 수행해야만 했다.

1. **TCP/IP 연결**: 애플리케이션 서버와 데이터베이스 서버 간의 물리적인 네트워크 연결을 시작한다. (3-way handshake)
2. **데이터베이스 인증**: 아이디, 패스워드 등의 자격 증명을 통해 데이터베이스로부터 접속을 허가받는다.
3. **세션 생성**: 인증된 사용자를 위한 데이터베이스 내부의 작업 공간(세션)을 할당받는다.
4. **SQL 실행**: 비로소 원하는 SQL을 실행한다.
5. **연결 종료**: 세션을 종료하고, TCP/IP 연결을 해제한다. (4-way handshake)

이 과정에서 가장 큰 비용을 발생시키는 구간은 바로 1, 2, 3번, 즉 **'커넥션을 획득하는 과정'** 이다.

```java
// 매번 새로운 커넥션을 생성하는 코드 (안티 패턴)
public Connection getConnection() throws SQLException {
    return DriverManager.getConnection("jdbc:mysql://localhost:3306/db", "user", "password");
}

public void doWork() {
    Connection conn = null;
    try {
        conn = getConnection();
        // ... SQL 실행 ...
    } catch (SQLException e) {
        // ... 예외 처리 ...
    } finally {
        if (conn != null) {
            try {
                conn.close();
            } catch (SQLException e) { /* ... */ }
        }
    }
}
```

매 요청마다 이 과정을 반복하는 것은 마치 은행에 갈 때마다 매번 번호표를 뽑고 신분증을 내밀며 신원 확인 절차를 처음부터 다시 밟는 것과 같았다. 동시 접속자가 조금만 몰려도 애플리케이션의 응답 속도는 급격히 저하되었고, 데이터베이스 서버는 수많은 연결 요청을 감당하지 못해 부하에 시달렸다.

## DB 커넥션 풀의 역할

이러한 비효율을 해결하기 위해 등장한 것이 바로 **DB 커넥션 풀(Database Connection Pool)**이다.

커넥션 풀의 아이디어는 단순하고 명료했다. "비용이 비싼 커넥션 객체를 미리 여러 개 만들어 '풀(Pool)'에 넣어두고, 필요할 때마다 빌려 쓴 뒤, 사용이 끝나면 풀에 다시 반납하여 재사용한다."

```java
// 커넥션 풀(HikariCP)을 사용하는 현대적인 방식
public DataSource createDataSource() {
    HikariDataSource ds = new HikariDataSource();
    ds.setJdbcUrl("jdbc:mysql://localhost:3306/db");
    ds.setUsername("user");
    ds.setPassword("password");
    ds.setMaximumPoolSize(10);
    return ds;
}

private static final DataSource dataSource = createDataSource();

public void doWorkWithPool() {
    try (Connection conn = dataSource.getConnection()) {
        // ... SQL 실행 ...
    } catch (SQLException e) {
        // ... 예외 처리 ...
    }
}
```

애플리케이션이 시작될 때, 설정된 만큼의 커넥션을 미리 다 만들어 둔다. 이제 데이터베이스 접근이 필요한 요청은 커넥션을 새로 만드는 대신, 풀에 가서 유휴 상태의 커넥션을 즉시 빌려와 사용하기만 하면 된다.

이를 통해 얻는 핵심 이점은 다음과 같았다:

* **성능 향상**: 커넥션 생성에 걸리는 시간이 제거되어 애플리케이션의 응답 속도가 비약적으로 향상되었다.
* **자원 효율화 및 안정성**: 미리 정해진 개수만큼의 커넥션만 생성하고 재사용하므로, 데이터베이스 서버의 부하를 예측 가능한 범위 내에서 제어할 수 있게 되었다.

## CPU와 RAM이 무한하다면?

그럼 본래 궁금했던 질문을 생각해보자. "만약 애플리케이션 서버의 CPU와 RAM이 무한하다면, 굳이 커넥션을 재사용할 필요가 있을까?"

결론부터 말하자면, **그렇다 해도 커넥션 풀은 여전히 필수적이다**. 이유는 다음과 같다.

### 1. '시간'은 자원과 다르다.

CPU와 RAM이 무한하다는 것은 '계산 속도'가 무한히 빠르다는 의미이지만, '물리적인 지연 시간'까지 0으로 만들지는 못한다. 커넥션을 생성하는 과정에는 CPU 성능과 무관한이 시간이 포함된다.

커넥션 풀은 이 지연 시간을 최초에만 감수하고, 이후에는 완전히 제거해 준다.

### 2. 병목은 데이터베이스 서버로 이전될 뿐이다.

애플리케이션 서버의 자원이 무한하다고 해서, 데이터베이스 서버의 자원까지 무한한 것은 아니다.

모든 데이터베이스는 동시에 처리할 수 있는 커넥션의 최대 개수(max\_connections)를 설정해 스스로를 보호한다. 커넥션 풀 없이 무분별하게 커넥션 요청이 쏟아져 들어온다면, 데이터베이스 서버는 결국 이 한계에 부딪혀 새로운 요청을 거부하거나 다운될 것이다.

커넥션 풀은 제한된 DB 커넥션이라는 자원을 여러 스레드가 효율적으로 나눠 쓸 수 있게 해주는 **'자원 관리자'** 의 역할도 수행한다.

## 결론

DB 커넥션 풀은 단순히 '자원이 부족해서' 사용하는 기술이 아니다. 이는 '시간'이라는 비가역적인 비용을 제거하고, 한정된 데이터베이스 자원을 효율적으로 관리하여 시스템 전체의 성능과 안정성을 보장하기 위한 필수적인 아키텍처이다.

우리가 무심코 사용하는 HikariCP는 이 모든 복잡한 과정을 추상화하여, 개발자가 비즈니스 로직에만 집중할 수 있도록 돕는 고마운 존재인 것이다. 그 당연함 속에 담긴 깊은 의미를 이해할 때, 우리는 더 견고하고 효율적인 시스템을 설계할 수 있게 될 거라고 생각한다!

## 참고 자료 (References)

* HikariCP Official GitHub Repository
  [https://github.com/brettwooldridge/HikariCP](https://github.com/brettwooldridge/HikariCP)

* Oracle - Using Data Sources (The Java™ Tutorials)
  [https://docs.oracle.com/javase/tutorial/jdbc/basics/sqldatasources.html](https://docs.oracle.com/javase/tutorial/jdbc/basics/sqldatasources.html)

* Spring Boot Documentation - Configure a DataSource
  [https://docs.spring.io/spring-boot/docs/current/reference/html/data.html#data.sql.datasource.configuration](https://docs.spring.io/spring-boot/docs/current/reference/html/data.html#data.sql.datasource.configuration)
