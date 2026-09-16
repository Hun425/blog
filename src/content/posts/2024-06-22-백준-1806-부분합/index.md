---
title: "백준 1806: 부분합"
description: "문제 링크범위를 보니 N^2 이하의 알고리즘을 사용해야하고, 가장 짧은 것의 길이만 구하면 되므로 슬라이딩 윈도우를 사용해야겠다고 생각했다.슬라이딩 윈도우O(N)범위 설정을 잘못해서 처음에 오답이 났었다.없을 것 같다!"
date: 2024-06-22
category: algorithm
tags: []
cover: ./cover.png
velogUrl: https://velog.io/@chae0738/%EB%B0%B1%EC%A4%80-1806-%EB%B6%80%EB%B6%84%ED%95%A9
---

[문제 링크](https://www.acmicpc.net/problem/1806)
# created : 2024-06-23

## 문제
![](./img-01.png)



## 떠올린 접근 방식, 과정
범위를 보니 N^2 이하의 알고리즘을 사용해야하고, 가장 짧은 것의 길이만 구하면 되므로 
슬라이딩 윈도우를 사용해야겠다고 생각했다.


## 알고리즘과 판단 사유
`슬라이딩 윈도우`


## 시간복잡도
O(N)


## 오류 해결 과정
범위 설정을 잘못해서 처음에 오답이 났었다.

## 개선 방법
없을 것 같다!


## 풀이 코드

``` java
import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException{
        BufferedReader br= new BufferedReader(new InputStreamReader(System.in));

        StringTokenizer st= new StringTokenizer(br.readLine());

        int N = Integer.parseInt(st.nextToken());
        int M = Integer.parseInt(st.nextToken());

        st= new StringTokenizer(br.readLine());

        long[] arr = new long[N];

        for (int i = 0; i < N; i++) {
            arr[i] = Long.parseLong(st.nextToken());
        }


        int cnt = 0;
        int s = 0;
        int e = 0;
        long sum = 0;
        int ans = Integer.MAX_VALUE;
        while(s<N && e<N+1 ){

            if(sum<M ){
                if(e==N)break;
                sum += arr[e];
                e++;

                cnt++;
            }
            if(sum>=M){
                ans = Math.min(ans, cnt);
                sum-=arr[s];
                s++;
                cnt--;
            }
        }

        if(ans==Integer.MAX_VALUE){
            System.out.println(0);
        }else{
            System.out.println(ans);
        }
    }
}
```
