---
title: "1억 4천만행 데이터 처리 시스템 구축하기 2편"
description: "이 맛에 개발자합니다"
date: 2025-03-28
category: backend
tags: ["kafka", "spark"]
cover: ./cover.jpeg
velogUrl: https://velog.io/@chae0738/1%EC%96%B5-4%EC%B2%9C%EB%A7%8C%ED%96%89-%EB%8D%B0%EC%9D%B4%ED%84%B0-%EC%B2%98%EB%A6%AC-%EC%8B%9C%EC%8A%A4%ED%85%9C-%EA%B5%AC%EC%B6%95%ED%95%98%EA%B8%B0-2%ED%8E%B8
---

[1편](https://velog.io/@chae0738/1%EC%96%B5-4%EC%B2%9C%EB%A7%8C%ED%96%89-%EB%8D%B0%EC%9D%B4%ED%84%B0-%EC%B2%98%EB%A6%AC-%EC%8B%9C%EC%8A%A4%ED%85%9C-%EA%B5%AC%EC%B6%95%ED%95%98%EA%B8%B0-1%ED%8E%B8)에서는 대용량 교통 데이터 처리 시스템의 배경과 아키텍처 설계에 대해 살펴보았다. 이번 편에서는 실제 구현 과정에서 만난 문제점들과 그 해결 방법, 성능 최적화에 대해 이야기하고자 한다.

## 트러블 슈팅: 처리 과정에서 발생한 주요 도전 과제

새로운 아키텍처를 구현하고 운영하면서 몇 가지 중요한 문제점을 발견했다.

### 1. 데이터 파싱 문제

처음 시스템을 구축했을 때, 다음과 같은 로그를 발견했다.

```
25/03/20 10:19:07 INFO SparkAggregator: 원본 데이터 샘플:
+--------------------+-----------+-------+---------------+-------------+-----+
|         create_date|create_hour|link_id|road_mgr_agency|traffic_speed|count|
+--------------------+-----------+-------+---------------+-------------+-----+
|"20250315","0000"...|       null|   null|           null|         null| null|
```

CSV 파일이 공백으로 구분되어 있었지만, Spark의 기본 구분자는 쉼표(,)다. 또한 데이터 내에 큰따옴표가 포함되어 있었다.

### 2. 데이터베이스 저장 성능 문제

데이터 처리 자체는 빠르게 완료되었지만, 데이터베이스 저장 단계에서 심각한 병목 현상이 발생했다.

```
SQL : UPDATE szms.spark_job_status SET status = 'PROCESSING', progress = 80, message = '시간별 집계 완료. 140728383개 집계 레코드 생성됨'
...
SQL : UPDATE szms.spark_job_status SET status = 'COMPLETED', progress = 100, message = '작업이 성공적으로 완료되었습니다'
```

2시간 7분이 소요된 작업(1654a3ce-d17e-4194-b7d6-612ce88e3e16)에서 데이터베이스 저장 단계만 1시간 40분이 소요되었다.

### 3. 데이터 타입 불일치 문제

데이터 로드 중 다음과 같은 타입 변환 오류가 발생했다.

```
ERROR: invalid input syntax for type integer: "116.12903225806451"
Where: COPY vs_its_hourly, line 2, column count: "116.12903225806451"
```

PostgreSQL 테이블의 `count` 열이 정수형(integer)으로 정의되어 있는데, CSV에는 소수점 값이 포함되어 있었다.

## 해결 과정: 문제별 접근 방식과 구현 방법

### 1. 데이터 파싱 문제 해결

SparkAggregator 클래스의 CSV 파일 읽기 부분을 다음과 같이 수정했다.

```java
// 스키마 정의: 명시적으로 각 컬럼 타입 지정
StructType schema = new StructType()
    .add("create_date", DataTypes.StringType)  // 날짜 형식 (20250315)
    .add("create_hour", DataTypes.IntegerType) // 시간 (0-23)
    .add("link_id", DataTypes.StringType)      // 링크 ID (과학적 표기법 포함 가능)
    .add("road_mgr_agency", DataTypes.StringType) // 도로관리기관
    .add("traffic_speed", DataTypes.DoubleType)   // 속도
    .add("count", DataTypes.IntegerType);         // 카운트

// 공백 구분자로 CSV 파일 읽기
Dataset<Row> rawData = spark.read()
    .option("delimiter", " ")      // 공백 구분자 사용
    .option("inferSchema", "false") // 스키마 자동 추론 비활성화
    .option("header", "false")      // 헤더 없음
    .option("quote", "\"")          // 따옴표 처리
    .option("escape", "\"")         // 이스케이프 문자
    .option("mode", "PERMISSIVE")   // 오류 허용 모드
    .schema(schema)                // 위에서 정의한 스키마 적용
    .csv(extractedFile.toString());
```

이러한 수정을 통해 데이터가 정상적으로 파싱되어 처리되기 시작했다.

### 2. 데이터베이스 저장 성능 최적화

DB 저장 성능 최적화를 위해 여러 단계적 접근 방식을 적용했다.

#### 첫 번째 시도: JDBC 최적화

처음에는 JDBC 설정과 Spark의 병렬 처리 능력을 활용한 기본적인 최적화를 시도했다:

```java
// 병렬 저장을 위한 설정
hourlyData
    .repartition(10, functions.col("create_date"), functions.col("link_id")) // 파티션 키로 분산
    .write()
    .mode(SaveMode.Append)
    .option("numPartitions", 10) // 병렬 연결 수
    .jdbc(dbUrl, tableName, connectionProperties);

// 대량 삽입을 위한 JDBC 연결 속성 설정
Properties connectionProperties = new Properties();
connectionProperties.put("user", dbUser);
connectionProperties.put("password", dbPassword);
connectionProperties.put("driver", "org.postgresql.Driver");
connectionProperties.put("reWriteBatchedInserts", "true");  // PostgreSQL 배치 삽입 최적화
connectionProperties.put("batchsize", "10000");            // 더 큰 배치 크기
```

하지만 이러한 최적화로는 저장 시간이 1시간 40분에서 약 한시간으로만 단축되었지만 여전히 너무 오래 걸렸다. 특히 원격 데이터베이스의 경우 네트워크 병목이 주요 원인이었다. 특히 제일 오래걸리는 이유가 스파크 하나당 8GB 램을 할당했기때문에 한번에 전송할 수 있는 양이 제한되어 있었고, 이는 수많은 JDBC 통신 > 인덱스생성의 반복으로 이어졌기 때문이다.

#### 두 번째 시도: 임시 테이블 활용 및 인덱스번
아까 **2번 문제**를 자세히 살펴보면, 테이블 크기와 관련하여 흥미로운 발견이 있었다. 원본 데이터는 CSV 형태로 약 6GB이지만, 데이터베이스에 저장 시 인덱스를 포함하면 16GB 이상으로 증가했다. 인덱스가 데이터베이스 크기에 미치는 영향을 분석한 결과

1. **인덱스 크기**: 복합 기본 키(create_date, create_hour, link_id)와 추가 인덱스 두 개가 원본 데이터 크기와 비슷하거나 더 큰 공간을 차지
2. **오버헤드**: 데이터베이스 시스템의 내부 메타데이터, 행 헤더, 페이지 헤더 등의 추가 오버헤드
3. **데이터 타입 확장**: 텍스트로 저장된 CSV와 달리 데이터베이스에서는 내부 타입 표현으로 인한 공간 증가

이런 문제점들이 있었다.
### 인덱스 비동기 생성을 통한 최적화

데이터 로드 성능을 더욱 개선하기 위해 인덱스 비동기 생성 방식을 도입했다.

1. **인덱스 없이 테이블 생성**

```sql
CREATE TABLE IF NOT EXISTS tems_test.vs_its_hourly (
   create_date DATE NOT NULL,
   create_hour INTEGER NOT NULL,
   link_id VARCHAR NOT NULL,
   -- 다른 컬럼들...
);
```

2. **데이터 로드 완료 후 백그라운드에서 인덱스 생성**

```java
CompletableFuture.runAsync(() -> {
    try (Connection conn = DriverManager.getConnection(dbUrl, dbUser, dbPassword);
         Statement stmt = conn.createStatement()) {
        
        logger.info("백그라운드에서 인덱스 생성 시작...");
        
        // 기본키 생성
        stmt.execute("ALTER TABLE " + tableName + 
                     " ADD PRIMARY KEY (create_date, create_hour, link_id)");
        
        // 인덱스 생성
        stmt.execute("CREATE INDEX idx_vs_its_hourly_date_hour ON " + 
                     tableName + " (create_date, create_hour)");
        
        stmt.execute("CREATE INDEX idx_vs_its_hourly_link_id ON " + 
                     tableName + " (link_id)");
        
        logger.info("모든 인덱스 생성 완료");
    } catch (SQLException e) {
        logger.error("인덱스 생성 중 오류 발생", e);
    }
});
```

이러한 접근 방식은 초기 데이터 로드 속도를 크게 향상시키면서도, 나중에 인덱스를 통한 쿼리 성능 이점을 얻을 수 있게 했다.

### 데이터베이스 설정 최적화

PostgreSQL 서버 설정 최적화를 통해 대량 삽입 성능을 추가로 개선했다

```sql
-- PostgreSQL 임시 최적화 설정 (작업 전/후 적용)
SET maintenance_work_mem = '1GB';
SET synchronous_commit = OFF;
SET wal_buffers = '16MB';
SET checkpoint_timeout = '30min';
SET max_wal_size = '4GB';
```

## 교훈과 향후 개선 방향

### 주요 교훈

1. **데이터 파싱 신중히 처리하기**
    
    - 항상 원본 데이터의 형식을 정확히 이해하고 적절한 파싱 옵션 적용
    - 과학적 표기법, 날짜 형식 등 특수한 데이터 형식에 주의
2. **단계적 성능 최적화**
    
    - 문제가 발생하면 단계별로 진단하여 병목 지점 식별
    - 로그를 통한 정확한 시간 측정으로 최적화 우선순위 결정
3. **분산 시스템 설계 고려사항**
    
    - 메시지 큐(Kafka)를 활용한 작업 분리로 시스템 안정성 확보
    - 상태 관리와 모니터링이 분산 시스템 설계의 핵심
4. **데이터베이스 최적화 기법**
    
    - 대량 데이터 처리에서는 JDBC보다 COPY 명령이 10배이상 성능 향상
    - 데이터 로드와 인덱스 생성 분리가 성능에 크게 기여
5. **플랫폼 종속성 이해와 해결**
    
    - Windows 환경에서 Hadoop 의존성 문제와 같은 플랫폼 특화 이슈 대응
    - 크로스 플랫폼 호환성을 고려한 코드 설계 필요

### 향후 개선 방향

1. **데이터 파티셔닝 및 인덱싱 전략**
    
    - 시간 기반 파티셔닝을 통한 쿼리 성능 최적화
    - 효율적인 데이터 접근을 위한 인덱스 전략 개선
2. **데이터 압축 및 저장 형식 최적화**
    
    - 장기 보관 데이터의 경우 열 기반 형식(Parquet)과 압축 적용
    - 콜드 스토리지와 핫 스토리지의 계층화된 저장 전략 도입
3. **비동기 인덱스 생성의 DB 커넥션 관리**
	
	- 현재 인덱스 비동기 생성 방식은 DB 커넥션 관리에 취약점이 있음
	- 장시간 실행되는 인덱스 생성 작업이 커넥션 풀을 고갈시키는 위험 존재
	- 비동기 작업 중 애플리케이션 종료 시 커넥션 리소스 누수 가능성

## 결론
![](./img-01.png)

결론적으로 일반 배치였다면 **40~50분** 걸리는 작업을 **20~30분** 걸리는 작업으로 단축 시킬 수 있었다.

전자정부 시스템에서 교통 데이터 처리를 위해 Kafka와 Spark를 도입한 이번 시도는 다양한 기술적 도전과 학습 기회가 되었다. 처음에는 데이터 파싱 문제와 데이터베이스 저장 성능 이슈라는 두 가지 주요 어려움에 직면했지만, 단계적인 문제 해결 접근 방식을 통해 안정적이고 효율적인 시스템을 구축할 수 있었다.

특히 Spark의 분산 처리 능력과 Kafka의 메시지 큐 기능을 활용한 아키텍처는 기존 배치 시스템의 한계를 극복하고, 대용량 데이터를 더 유연하게 처리할 수 있는 기반을 마련했다. 데이터베이스 저장 성능 최적화 과정에서 얻은 교훈, 특히 PostgreSQL COPY 명령의 활용과 인덱스 비동기 생성 전략 부분쪽은 다른 유사한 대용량 데이터 처리 시스템에도 적용할 수 있는 귀중한 지식이 되었다.

이번 최적화를 직접 고민해보고 공부하면서 구축해보니 **시간이 가는줄 몰랐고**, **너무 재밌었다. **
`개발자 하기 잘한거 같다..`
향후에는 클러스터 자원 활용 최적화, 그리고 더 정교한 데이터 관리 전략을 통해 시스템을 계속 발전시켜 나갈 계획이다.`실제 운영에 적용된다면 말이다` 
이번 경험이 앞으로의 다른 프로젝트들에서의 문제 해결에 많은 도움이 될 것 같다.
