---
title: "데이터베이스 정규화와 비정규화에 대한 고찰"
description: "데이터 모델링을 하며 생긴 의문점 해소"
date: 2025-02-03
category: cs
tags: []
cover: ./cover.png
velogUrl: https://velog.io/@chae0738/%EB%8D%B0%EC%9D%B4%ED%84%B0%EB%B2%A0%EC%9D%B4%EC%8A%A4-%EC%A0%95%EA%B7%9C%ED%99%94%EC%99%80-%EB%B9%84%EC%A0%95%EA%B7%9C%ED%99%94%EC%97%90-%EB%8C%80%ED%95%9C-%EA%B3%A0%EC%B0%B0
---

실무에서 **데이터 모델링**을 해보면서 문득 이런 생각이 들었다.
 `실제 프로젝트에서는 정규화(비정규화)와 성능 중 어떤 것을 더 우선시해야 할까?`라는 의문점에서 시작해 공부한 내용을 정리해보고자 한다.

## 정규화와 비정규화, 실제 사례를 통한 고찰

정규화와 성능은 데이터베이스 설계에서 늘 대립되는 두 가지 가치다. 실무에서 마주한 차량 통계 데이터를 통해 이 두 가지 접근법을 자세히 살펴보자.

### 첫 번째 시도: 정규화된 접근

처음에는 당연히 정규화된 구조로 접근했다. 정처기에서도 중요하게 다뤘었고 평소 모델링 할 때 많이 했던 방식이다.

```sql
CREATE TABLE VEHICLE_TYPE (
    type_id INT PRIMARY KEY,
    type_name VARCHAR(50)  -- 승용차, 화물차, 특수차 등
);

CREATE TABLE FUEL_TYPE (
    fuel_id INT PRIMARY KEY,
    fuel_name VARCHAR(50)  -- 휘발유, 경유, LPG, 기타연료 등
);

CREATE TABLE VEHICLE_STATS (
    stats_id INT PRIMARY KEY,
    type_id INT REFERENCES VEHICLE_TYPE(type_id),
    fuel_id INT REFERENCES FUEL_TYPE(fuel_id),
    sum DECIMAL(15,2),
    sp DECIMAL(15,2),
    bs DECIMAL(15,2),
    dg DECIMAL(15,2)
);
```

이 구조는 데이터의 일관성과 무결성 측면에서는 완벽해 보였다. 하지만 실제 쿼리를 작성하고 성능 측정을 위해 실행 계획을 분석하면서 예상치 못한 문제를 발견했다.

### 실행 계획 분석

정규화된 구조에서 단순한 통계 쿼리를 실행하면 이렇게 된다.

```sql
EXPLAIN ANALYZE
SELECT vt.type_name, ft.fuel_name, SUM(vs.sum)
FROM VEHICLE_STATS vs
JOIN VEHICLE_TYPE vt ON vs.type_id = vt.type_id
JOIN FUEL_TYPE ft ON vs.fuel_id = ft.fuel_id
WHERE vt.type_name = '승용차';
```

`실행 계획을 보니 생각보다 길어서 당황`

```
Aggregate  (cost=178.41..178.42 rows=1 width=48)
  ->  Hash Join  (cost=20.62..174.20 rows=420 width=16)
        Hash Cond: (vs.type_id = vt.type_id)
        ->  Hash Join  (cost=10.31..162.34 rows=420 width=20)
              Hash Cond: (vs.fuel_id = ft.fuel_id)
              ->  Seq Scan on vehicle_stats vs
              ->  Hash  (cost=8.20..8.20 rows=5 width=36)
                    ->  Seq Scan on fuel_type ft
        ->  Hash  (cost=8.20..8.20 rows=3 width=36)
              ->  Seq Scan on vehicle_type vt
                    Filter: (type_name = '승용차'::text)
```

단순한 통계 조회를 위해 데이터베이스는 세 번의 테이블 스캔과 두 번의 해시 조인을 수행해야 했다. `PostgreSQL 기준`

### 두 번째 접근: 비정규화 구조 실험

이러한 발견 후, 비정규화된 구조로 같은 쿼리를 실험해보았다

```sql
EXPLAIN ANALYZE
SELECT car_catg, fuel_catg, SUM(sum) 
FROM VEHICLE_STATS 
WHERE car_catg = '승용차';
```

실행 계획의 차이는?

```
Aggregate  (cost=87.30..87.31 rows=1 width=48)
  ->  Seq Scan on vehicle_stats  (cost=0.00..85.20 rows=420 width=16)
        Filter: (car_catg = '승용차'::text)
```

단순 테이블 스캔과 필터링만으로 같은 결과를 얻을 수 있었고, 쿼리 비용은 절반 이상 감소했다.

## 정규화와 비정규화의 트레이드오프

이 실험을 통해 각 접근법의 특징을 명확히 이해할 수 있었다.

정규화된 구조의 특징:
- 데이터 일관성과 무결성이 보장됨
- JOIN 연산으로 인한 성능 저하
- 복잡한 쿼리 구조

비정규화된 구조의 특징:
- 단순한 쿼리로 빠른 결과
- 메모리 사용이 효율적
- 데이터 변경 시 일관성 관리 필요

## 결론

이 과정을 통해 한 가지 중요한 사실을 깨달았다. 데이터베이스 설계는 `정답`이 없고, 실제 사용 패턴과 고객사의 요구사항에 따라 유연하게 접근해야 한다는 것이다. (SI라고 가정했을때..) 
우리의 경우 통계 데이터라는 특성상 데이터 변경이 적고 조회가 빈번했기에 비정규화를 선택했지만, 다른 상황이었다면 다른 선택을 했을 것이다.

이번 공부를 통해 알게 된 내용은, 이론적 완벽함보다는 실제 요구사항과 개발자의 휴먼 에러를 줄이기 위한 노력, 그리고 성능을 균형있게 고려하는 것이 더 중요하다는 점이다. `준공때 편하려면...` 
이는 데이터베이스 설계뿐만 아니라 소프트웨어 개발 전반에 적용될 수 있는 중요한 교훈일 것 같다!
