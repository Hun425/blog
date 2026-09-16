---
title: "운영체제에서는 어떤 알고리즘이 쓰일까?"
description: "알고리즘을 공부하면서 생긴 의문점 해소하기"
date: 2024-11-08
category: cs
tags: ["알고리즘", "운영체제", "프로세스스케줄링"]
cover: ./cover.png
velogUrl: https://velog.io/@chae0738/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C%EC%97%90%EC%84%9C%EB%8A%94-%EC%96%B4%EB%96%A4-%EC%95%8C%EA%B3%A0%EB%A6%AC%EC%A6%98%EC%9D%B4-%EC%93%B0%EC%9D%BC%EA%B9%8C
---

운영체제는 컴퓨터 하드웨어와 소프트웨어 간의 **중재 역할**을 하는 중요한 시스템 소프트웨어이다. 운영체제는 사용자와 컴퓨터 하드웨어 간의 **상호작용**을 관리하며, 여러 가지 기능을 수행한다. 이번 포스트에서는 **운영체제**에서 사용되는 **다양한 알고리즘**과 그 기능에 대해 알아보고자 한다.

### 운영체제의 정의

운영체제는 컴퓨터 **시스템의 자원을 관리**하고, 사용자와 하드웨어 간의 상호작용을 가능하게 하는 소프트웨어이다. 운영체제는 하드웨어를 효율적으로 사용할 수 있도록 도와주며, 여러 프로그램이 동시에 실행될 수 있도록 지원한다.

### 운영체제의 주요 기능

운영체제는 다음과 같은 주요 기능을 가지고 있다.

- **프로세스 관리** : 프로세스의 생성, 실행, 종료를 관리
- **메모리 관리** : 메모리의 할당과 해제를 관리하여 효율적인 메모리 사용
- **입출력 관리** : 하드웨어 장치와의 데이터 전송을 관리
- **파일 시스템 관리** : 파일의 생성, 삭제, 읽기, 쓰기를 관리

### 프로세스와 스레드

프로세스는 실행 중인 프로그램의 인스턴스이며, 스레드는 프로세스 내에서 실행되는 경량 프로세스이다. 운영체제는 프로세스와 스레드를 관리하여 **CPU 자원을 효율적**으로 분배한다.

### 프로세스 스케줄링 알고리즘

운영체제는 여러 프로세스가 동시에 실행될 때, 어떤 프로세스를 먼저 실행할지를 결정하는 **스케줄링 알고리즘**을 사용합니다. 대표적인 스케줄링 알고리즘으로는 다음과 같은 것들이 있다.

- **FCFS (First-Come, First-Served)**: 먼저 도착한 프로세스를 먼저 실행
- **SJF (Shortest Job First)**: 가장 짧은 실행 시간을 가진 프로세스를 먼저 실행
- **RR (Round Robin)**: 각 프로세스에 일정 시간 할당 후, 다음 프로세스로 전환

이러한 알고리즘들은 프로세스의 효율적인 실행을 도와주며, 시스템의 **응답성을 향상**시킨다.

![image0](https://img1.daumcdn.net/thumb/R800x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdn%2FbmBFC4%2FbtsAXhxKCky%2FtjKzqrjOsjwPrCiGssYeJk%2Fimg.webp)

[이미지 출처](https://oobwrite.com/entry/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C-%ED%94%84%EB%A1%9C%EC%84%B8%EC%8A%A4Process%EC%99%80-%EC%8A%A4%EC%BC%80%EC%A4%84%EB%A7%81-%EC%95%8C%EA%B3%A0%EB%A6%AC%EC%A6%98)

### 메모리 관리 알고리즘

메모리 관리 알고리즘은 프로세스가 필요로 하는 **메모리를 할당하고 해제**하는 역할을 한다. 대표적인 메모리 관리 기법으로는 다음과 같은 것들이 있다.

- **페이징** : 메모리를 고정 크기의 페이지로 나누어 관리
- **세그멘테이션** : 프로그램을 논리적인 세그먼트로 나누어 관리
- **페이지 교체 알고리즘** : 메모리가 가득 찼을 때 어떤 페이지를 교체할지를 결정

![image1](https://user-images.githubusercontent.com/70622731/166139153-f1fe0803-8116-417b-a746-03469178b95e.png)

[이미지 출처](https://wookcode.tistory.com/184)

### 입출력 관리

입출력 관리는 하드웨어 장치와의 데이터 전송을 관리하는 기능이다. 운영체제는 다양한 입출력 장치에 대한 드라이버를 제공하여, 사용자와 하드웨어 간의 원활한 데이터 전송을 지원한다.

### 파일 시스템

파일 시스템은 데이터를 파일 형태로 저장하고 관리하는 기능을 제공한다. 운영체제는 파일의 생성, 삭제, 읽기, 쓰기 등의 작업을 지원하며, 파일의 구조와 접근 방법을 정의한다.

### 운영체제의 종류

운영체제는 여러 종류가 있으며, 각기 다른 특징을 가지고 있다. 대표적인 운영체제로는 다음과 같은 것들이 있다.

- **Windows** : 마이크로소프트에서 개발한 운영체제로, 사용자 친화적인 인터페이스를 제공
- **Linux** : 오픈 소스 운영체제로, 다양한 배포판이 존재
- **MacOS** : 애플에서 개발한 운영체제로, 고유의 사용자 인터페이스 제공
- **UNIX** : 현대 운영체제의 기초가 되는 시스템으로, 안정성과 보안성이 뛰어남

![image3](https://raonctf.com/static/essential/images/system/operating_system_03.jpg)

[이미지 출처](https://raonctf.com/essential/study/web/operating_system)

### 미래의 운영체제

미래의 운영체제는 인공지능, 클라우드 컴퓨팅, IoT(사물인터넷) 등과 같은 최신 기술을 반영하여 발전할 것이다.이러한 기술들은 운영체제의 기능을 더욱 확장하고, 사용자 경험을 향상시킬 것이라고 생각한다.

운영체제는 컴퓨터 시스템의 핵심적인 부분으로, 다양한 알고리즘과 기능을 통해 효율적인 자원 관리를 지원한다. 앞으로 갈수록 알고리즘의 중요성이 더 높아질 것 같다....

![image4](https://www.hanbit.co.kr/data/editor/20231027090450_wfludeql.png)

[이미지 출처](https://m.hanbit.co.kr/channel/category/category_view.html?cms_code=CMS2832062046)



### 참고




[1] 티스토리 - [운영체제/OS 프로세스 스케줄링 알고리즘 - 박개봄 블로그]([https://gaebom.tistory.com/58](https://gaebom.tistory.com/58))

[2] velog - [운영체제 프로세스 스케줄링 종류와 기법]([https://velog.io/@ohsol/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C-%ED%94%84%EB%A1%9C%EC%84%B8%EC%8A%A4-%EC%8A%A4%EC%BC%80%EC%A4%84%EB%A7%81-%EC%A2%85%EB%A5%98%EC%99%80-%EA%B8%B0%EB%B2%95](https://velog.io/@ohsol/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C-%ED%94%84%EB%A1%9C%EC%84%B8%EC%8A%A4-%EC%8A%A4%EC%BC%80%EC%A4%84%EB%A7%81-%EC%A2%85%EB%A5%98%EC%99%80-%EA%B8%B0%EB%B2%95))

[3] velog - [운영체제 스케줄링 알고리즘]([https://velog.io/@seokjun0915/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C-%EC%8A%A4%EC%BC%80%EC%A4%84%EB%A7%81-%EC%95%8C%EA%B3%A0%EB%A6%AC%EC%A6%98](https://velog.io/@seokjun0915/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C-%EC%8A%A4%EC%BC%80%EC%A4%84%EB%A7%81-%EC%95%8C%EA%B3%A0%EB%A6%AC%EC%A6%98))

[4] 티스토리 - [CS 운영체제 스케줄링 기본 및 알고리즘 이해 - OpenDev]([https://opendeveloper.tistory.com/entry/CS-%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C-%EC%8A%A4%EC%BC%80%EC%A4%84%EB%A7%81-%EA%B8%B0%EB%B3%B8-%EB%B0%8F-%EC%95%8C%EA%B3%A0%EB%A6%AC%EC%A6%98-%EC%9D%B4%ED%95%B4](https://opendeveloper.tistory.com/entry/CS-%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C-%EC%8A%A4%EC%BC%80%EC%A4%84%EB%A7%81-%EA%B8%B0%EB%B3%B8-%EB%B0%8F-%EC%95%8C%EA%B3%A0%EB%A6%AC%EC%A6%98-%EC%9D%B4%ED%95%B4))
