---
title: "Discord가 수조 개의 메세지를 인덱싱하는 방법"
description: "쿠버네티스를 쓰는데는 이유가 있다."
date: 2025-05-07
category: infra
tags: ["쿠버네티스"]
cover: ./cover.jpg
velogUrl: https://velog.io/@chae0738/Discord%EA%B0%80-%EC%88%98%EC%A1%B0-%EA%B0%9C%EC%9D%98-%EB%A9%94%EC%84%B8%EC%A7%80%EB%A5%BC-%EC%9D%B8%EB%8D%B1%EC%8B%B1%ED%95%98%EB%8A%94-%EB%B0%A9%EB%B2%95
---

## 최근 근황
드디어 회사에서 개발을 시작했다!
물론 생각했던 방식과는 매우 거리가 멀지만... `그립습니다 SSAFY`
그래도 산출물이 아닌게 어디냐고 생각하기로 하고 번아웃을 극복하기위해 열심히 노력중이다 ㅜㅜ

## 갑자기 보게된 GeekNews
회사에서 쉬는시간에 GeekNews를 보던 도중, 눈길을 끄는 제목을 발견했다.
바로 그 제목은..! 내 블로그 제목과 일치하는 [디스코드가 수조 개의 메세지를 인덱싱하는 방법](https://news.hada.io/topic?id=20706)이다.
이를 보고 크게 관심이가서 공부를 해보게 되었고, 그 내용을 정리해보고자 한다.

## Discord의 아키택처
Discord는 수조 개의 메시지를 효율적으로 저장하고 검색하기 위해 새로운 아키텍처를 도입했다. 이전 아키텍처의 문제점과 이를 해결하기 위한 새로운 접근 방식을 살펴보자.

## 기존 아키텍처의 한계

Discord는 초기에 **Elasticsearch**를 사용하여 메시지 검색 시스템을 구축했다.
이는 성능이 좋고 비용 효율적이며 확장 가능한 구조였다.
메시지는 서버(Guild) 또는 개인 메시지(DM)별로 샤딩되어 저장되었다. 
그러나 Discord가 성장함에 따라 여러 문제점이 드러났다

1. Redis 기반의 메시지 인덱싱 큐가 과부하 시 메시지를 유실
2. 대량 인덱싱이 Elasticsearch 노드 장애에 취약함. 단일 노드 장애 시 약 40%의 작업이 실패
3. 대규모 Elasticsearch 클러스터(200+ 노드)의 관리 부담이 증가
4. 롤링 재시작이나 소프트웨어 업그레이드가 어려움
5. 큰 서버의 인덱스가 Lucene의 20억 문서 제한에 도달하는 문제가 발생

## 아키텍처 비교

### 기존 아키텍처 구조

```
[Redis 메시지 큐]  
     │  
     ▼  
[단일 대형 Elasticsearch 클러스터]  
  └─ 200+ 노드  
  └─ 단일 장애점 존재

```

**주요 문제점**

- Redis 과부하 시 메시지 유실
- 노드 장애 시 전체 클러스터 영향
- Lucene 20억 문서 제한 도달 문제

### 신규 아키텍처 구조

```
[PubSub 시스템]  
     │  
     ▼  
[메시지 라우터]  
     ├─▶ [Guild 셀] → 다중 ES 클러스터 (서버별 메시지)  
     ├─▶ [DM 셀] → 다중 ES 클러스터 (사용자별 DM)  
     └─▶ [BFG 셀] → 다중 ES 클러스터 (초대형 서버)  
```

**핵심 개선사항**

- PubSub로 메시지 유실 방지
- 목적별 셀 분리로 장애 영향 최소화
- Rust 기반 비동기 처리로 성능 2배 향상
- 쿠버네티스 오토스케일링 지원

## 주요 기술 스택 비교

| 구성 요소  | 기존         | 신규         |
| ------ | ---------- | ---------- |
| 메시지 전달 | Redis 큐    | PubSub 시스템 |
| 검색 엔진  | 단일 ES 클러스터 | 다중 ES 셀    |
| 확장 방식  | 수직 확장      | 수평 확장      |
| 장애 복구  | 수동 개입      | 자동 복구      |
| 최대 처리량 | 분당 50만 건   | 분당 120만 건  |



## 새로운 아키텍처: 셀 기반 접근법

이러한 문제를 해결하기 위해 Discord는 여러 개의 작은 Elasticsearch 클러스터를 논리적으로 그룹화한 "셀(Cell)" 아키텍처를 도입했다. 이는 다음과 같은 이점을 제공했다

### PubSub 시스템

기존 Redis 큐를 PubSub 시스템으로 대체했다. 이를 통해 다음과 같은 이점을 얻었다

- 보장된 메시지 전달로 메시지 유실 방지
- 대규모 메시지 백로그 처리 능력 향상
- 작업 스케줄링 등 다른 용도로도 확장 적용

**PubSub와 Redis 비교:**

```
Redis 큐 (이전):
- CPU 부하 증가 시 메시지 드롭
- 백로그 처리 한계
- 단일 장애점

PubSub 시스템 (새로운 구조):
- 보장된 메시지 전달
- 대규모 백로그 허용
- 장애 복원력 증가
```

### 메시지 라우터

PubSub에서 스트리밍되는 메시지를 효율적으로 처리하기 위한 메시지 라우터를 구현했다

- 목적지(Elasticsearch 클러스터 및 인덱스)별로 메시지 그룹화
- Rust의 tokio 태스크와 채널을 사용한 병렬 처리
- 동일한 목적지의 메시지를 배치로 묶어 인덱싱 성능 향상

**메시지 라우터 Rust 코드**

```rust
/// MessageRouter는 메시지를 동적으로 생성된 목적지로 라우팅한다.
struct MessageRouter<DestinationKeyT, MessageT> {
    destinations: RwLock<HashMap<DestinationKeyT, UnboundedSender<MessageT>>,
}

impl<DestinationKeyT, MessageT> MessageRouter {
    /// 주어진 목적지로 메시지 전송 시도, 목적지가 없으면 생성한다.
    fn send_message(
        &self,
        destination_key: DestinationKeyT,
        message: MessageT,
    ) -> Result<()> {
        let mut destinations = self.destinations.write();
        match destinations.entry(destination_key) {
            Entry::Occupied(mut ent) => {
                // 주어진 목적지로 메시지 전송
                ent.get().send(message).ok();
            }
            Entry::Vacant(ent) => {
                // 새 목적지와 수신자 생성
                let (destination_sender, destination_receiver) = unbounded_channel();
                let task = tokio::task::spawn(async move {
                    // 목적지 태스크는 동일한 목적지 키를 가진 메시지를 수신
                    // 우리의 경우, 목적지 태스크는 메시지를 청크로 그룹화하고
                    // Elasticsearch에 일괄 인덱싱한다.
                });
                ent.insert(destination_sender).send(message).ok();
            }
        }
        Ok(())
    }
}
```

### 셀 아키텍처

여러 개의 작은 Elasticsearch 클러스터를 논리적으로 그룹화한 셀 구조를 도입했다

**셀 유형별 구성:**

```
1. Guild 메시지 셀:
   - 목적: 서버(Guild) 메시지 저장 및 검색
   - 샤딩 방식: Guild ID 기준
   - 구성: 여러 개의 작은 Elasticsearch 클러스터
   - 특징: 일반적으로 단일 샤드 인덱스 사용

2. 사용자 DM 메시지 셀:
   - 목적: 개인 메시지(DM) 저장 및 검색
   - 샤딩 방식: 사용자 ID 기준
   - 특징: 사용자의 모든 DM을 한 번에 검색 가능
   - 이중 인덱싱: 메시지가 양쪽 사용자의 인덱스에 모두 저장

3. BFG(Big Freaking Guilds) 전용 셀:
   - 목적: 초대형 서버 메시지 처리
   - 샤딩 방식: 다중 샤드 인덱스 사용
   - 특징: Lucene의 20억 문서 제한 극복
```

각 클러스터는 다음과 같은 구성을 가졌다:

**Elasticsearch 클러스터 구성:**

```yaml
# ECK Operator를 통한 Elasticsearch 클러스터 정의 예시
apiVersion: elasticsearch.k8s.elastic.co/v1
kind: Elasticsearch
metadata:
  name: guild-cluster-1
spec:
  version: 7.10.0
  nodeSets:
  - name: master
    count: 3  # 영역당 1개씩 총 3개
    config:
      node.roles: ["master"]
    volumeClaimTemplates:
    - metadata:
        name: elasticsearch-data
      spec:
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 100Gi
  - name: ingest
    count: 3  # 최소 3개의 인제스트 노드
    config:
      node.roles: ["ingest"]
  - name: data
    count: 10  # 데이터 노드 수
    config:
      node.roles: ["data"]
    volumeClaimTemplates:
    - metadata:
        name: elasticsearch-data
      spec:
        resources:
          requests:
            storage: 2Ti
```

## 쿠버네티스 기반 운영

Discord는 전체 시스템을 쿠버네티스 위에서 운영하기 시작했다

### Elastic Kubernetes Operator(ECK)

Elasticsearch 클러스터 관리를 자동화하기 위해 ECK를 도입했다

- 클러스터 토폴로지와 구성을 선언적으로 정의
- OS 업그레이드 자동화
- 롤링 재시작과 업그레이드를 안전하게 수행

**ECK 작동 방식:**

```
+---------------------+     +--------------------+
| Kubernetes API 서버  | <-- | ECK Operator       |
+---------------------+     +--------------------+
         ^                           |
         |                           |
         |                           v
+---------------------+     +--------------------+
| Elasticsearch CR    |     | Elasticsearch Pod  |
| (Custom Resource)   |     | (자동 생성 및 관리)  |
+---------------------+     +--------------------+
```

### 자동 확장 및 관리

쿠버네티스를 통해 리소스 관리를 자동화했다

**HPA 구성 예시:**

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: elasticsearch-ingest-autoscaler
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: elasticsearch-ingest
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

**자동 확장 메커니즘:**

```
1. 메트릭 모니터링:
   - CPU 사용률 > 70% → Pod 추가
   - CPU 사용률 < 30% → Pod 제거

2. 클러스터 Autoscaler:
   - Pod이 스케줄링 불가 → 노드 추가
   - 노드 사용률 낮음 → 노드 제거
```

### 인프라 자동화의 이점

클라우드와 쿠버네티스 조합의 장점을 활용했다

- 필요에 따른 리소스 자동 확장/축소
- 수동 관리 없이 서비스 확장 가능
- 장애 자동 복구 및 무중단 업데이트

**장애 복구 프로세스:**

```
1. 노드 장애 감지: 쿠버네티스가 노드 실패 감지
2. Pod 재스케줄링: 장애 노드의 Pod을 정상 노드로 이동
3. 데이터 복구: Elasticsearch 복제본에서 데이터 복구
4. 서비스 계속: 사용자는 서비스 중단 감지 못함
```

## Elasticsearch의 분산 데이터베이스 구조

Elasticsearch는 처음부터 분산 시스템으로 설계되어 Discord의 대규모 데이터 처리에 적합했다

### 샤딩(Sharding)

데이터를 수평적으로 분할하는 방식을 사용했다

**샤딩 다이어그램:**

```
인덱스 (10억 문서)
  |
  |-- 샤드 1 (2억 문서) --> 노드 A
  |-- 샤드 2 (2억 문서) --> 노드 B
  |-- 샤드 3 (2억 문서) --> 노드 C
  |-- 샤드 4 (2억 문서) --> 노드 D
  |-- 샤드 5 (2억 문서) --> 노드 E
```

**Discord의 샤딩 전략:**

```
1. 일반 서버(Guild):
   - 단일 샤드 인덱스 (성능 최적화)
   - 쿼리 시 단일 노드만 조회

2. 대규모 서버(BFG):
   - 다중 샤드 인덱스
   - 샤드 수 = ceil(예상 메시지 수 / 10억)
```

### 복제(Replication)

데이터 안정성과 가용성을 위한 복제 전략을 구현했다

**복제본 구성:**

```
프라이머리 샤드 (노드 A, 가용 영역 1)
  |
  |-- 레플리카 1 (노드 B, 가용 영역 2)
  |-- 레플리카 2 (노드 C, 가용 영역 3)
```

**Elasticsearch 설정 예시:**

```yaml
index.number_of_shards: 1                    # 샤드 수
index.number_of_replicas: 2                  # 복제본 수
cluster.routing.allocation.awareness.attributes: zone
cluster.routing.allocation.awareness.force.zone.values: zone1,zone2,zone3
```

### 동시성 처리

분산 환경에서의 동시성 문제를 다음과 같이 해결했다

**낙관적 동시성 제어 예시:**

```json
// 문서 버전 확인
GET /guild-messages/message/12345

// 버전 지정 업데이트
PUT /guild-messages/message/12345?version=3
{
  "content": "수정된 메시지 내용"
}
```

**샤딩 및 라우팅 흐름:**

```
1. 메시지 ID 해싱: hash(message_id) % num_shards
2. 라우팅 키 사용: ?routing=guild_id
3. 같은 키의 문서는 같은 샤드에 저장
4. 검색 시 샤드 간 결과 병합
```

## 결과와 성과

새로운 아키텍처 도입 후 Discord는 다음과 같은 성과를 얻었다:

**성능 향상 지표:**

```
+------------------------+----------------+----------------+
| 지표                    | 이전 아키텍처    | 새 아키텍처      |
+------------------------+----------------+----------------+
| 메시지 인덱싱            | 기준           | 2배 처리량       |
| 평균 쿼리 응답 시간       | 500ms         | <100ms         |
| P99 응답 시간           | 1초            | <500ms         |
| 인덱스 규모              | 제한적         | 수조 개 메시지   |
| 클러스터 수              | 2개            | 40+ 클러스터    |
| 인덱스 수                | 수백 개        | 수천 개         |
| 노드 장애 영향           | ~40% 실패율    | 최소화          |
| 업그레이드 방식           | 서비스 중단     | 무중단 업그레이드 |
+------------------------+----------------+----------------+
```

**BFG 지원 개선**

```
이전: 20억 메시지 제한에 도달한 서버는 검색 불가
현재: 다중 샤드 인덱스로 무제한 메시지 지원
```

**아키텍처 규모**

```
- 40+ Elasticsearch 클러스터
- 수천 개의 인덱스
- 수조 개의 메시지 인덱싱
- 수백 개의 쿠버네티스 노드
```

## 결론

Discord는 셀 아키텍처와 쿠버네티스를 활용하여 대규모 메시지 인덱싱 문제를 해결했다. 이러한 접근 방식은 확장성, 안정성, 관리 용이성을 크게 향상시켰으며, 수조 개의 메시지를 효율적으로 처리할 수 있게 했다. 이번 공부를 계기로 쿠버네티스에 대해서 더 관심을 가지게 된 것 같다.

이 아키텍처로 알 수 있는 핵심 교훈은 다음과 같다.

1. 대규모 단일 클러스터보다 여러 작은 클러스터가 더 안정적이다.
2. 메시지 보장을 위한 PubSub 시스템은 데이터 유실 방지에 필수적이다.
3. 목적별로 데이터를 분리하면(셀 아키텍처) 특화된 최적화가 가능하다.
4. 쿠버네티스를 통한 인프라 자동화는 대규모 시스템 관리를 단순화한다.
5. Elasticsearch의 분산 기능을 활용하면 거의 무제한의 확장성을 얻을 수 있다.

이는 대규모 분산 시스템을 설계할 때 참고할 수 있는 훌륭한 사례일 것 같다.
시간이 나면 미니 디스코드 구현해봐야겠다...


## 참고자료
- [Discord 공식 블로그](https://discord.com/blog/how-discord-indexes-trillions-of-messages)
