---
title: "백준 7579 : 앱"
description: "문제 링크 DP로 결과값을 배낭문제처럼 분할해서 접근했다!Memory의 범위가 매우 넓고, 문제 메모리 조건이 128MB로 작기 때문에, cost를 기준으로 잡고 DP 공식을 만들었다!DPO(N)그리디 접근방식에서 틀린걸 깨닫고 DP 방식으로 다시 접근했다없을 것 같다"
date: 2024-06-26
category: algorithm
tags: ["DP", "Java", "알고리즘"]
cover: ./cover.png
velogUrl: https://velog.io/@chae0738/%EB%B0%B1%EC%A4%80-7579-%EC%95%B1
---

[문제 링크](https://www.acmicpc.net/problem/7579)
# created : 2024-06-26

## 문제
![](./img-01.png)



## 떠올린 접근 방식, 과정
 DP로 결과값을 배낭문제처럼 분할해서 접근했다!
Memory의 범위가 매우 넓고, 문제 메모리 조건이 128MB로 작기 때문에, cost를 기준으로 잡고 DP 공식을 만들었다!
## 알고리즘과 판단 사유
`DP`


## 시간복잡도

O(N)

## 오류 해결 과정
그리디 접근방식에서 틀린걸 깨닫고 DP 방식으로 다시 접근했다

## 개선 방법
없을 것 같다!


## 풀이 코드

``` java
import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException{
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));

        StringTokenizer st = new StringTokenizer(br.readLine());

        int N = Integer.parseInt(st.nextToken());
        int M = Integer.parseInt(st.nextToken());

        int[] weight = new int[N];
        int[] value = new int[N];


        st= new StringTokenizer(br.readLine());

        for (int i = 0; i < N; i++) {
            weight[i] = Integer.parseInt(st.nextToken());
        }

        st = new StringTokenizer(br.readLine());

        for (int i = 0; i < N; i++) {
            value[i] = Integer.parseInt(st.nextToken());
        }

        for (int i = 0; i < N; i++) {
            group[i][0] = weight[i];
            group[i][1] = value[i];
        }

        int[] dp = new int[10001];

        for (int i = 0; i < dp.length; i++) {
            dp[i] = -1;
        }

        for (int i = 0; i < N; i++) {
            int cost = value[i];
            for (int j = 10000; j >= cost ; j--) {
                if(dp[j-cost]!=-1){
                    dp[j] =Math.max(dp[j],dp[j-cost]+weight[i]);
                }
            }

            dp[cost] = Math.max(dp[cost],weight[i]);
        }

        for (int i = 0; i < dp.length; i++) {
            if(dp[i]>=M){
                System.out.println(i);
                break;
            }
        }


    }
}
```
