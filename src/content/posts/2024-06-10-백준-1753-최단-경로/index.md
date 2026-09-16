---
title: "백준 1753: 최단 경로"
description: "문제 링크일반적인 최단 경로 문제이므로 다익스트라를 사용했다!다익스트라 DijkstraO(V+E)pq에 넣을때 최적화된 값을 넣지 않아서 시간초과가 나는 오류가 있었다...고쳐서 바로 해결했다!이미 pq를 사용해서 없을 것 같다!"
date: 2024-06-10
category: algorithm
tags: ["Java", "다익스트라", "알고리즘"]
cover: ./cover.png
velogUrl: https://velog.io/@chae0738/%EB%B0%B1%EC%A4%80-1753-%EC%B5%9C%EB%8B%A8-%EA%B2%BD%EB%A1%9C
---

[문제 링크](https://www.acmicpc.net/problem/1753)
# created : 2024-06-10

## 문제

![](./img-01.png)


## 떠올린 접근 방식, 과정

일반적인 **최단 경로** 문제이므로 **다익스트라**를 사용했다!

## 알고리즘과 판단 사유

다익스트라 `Dijkstra`

## 시간복잡도

O(V+E)

## 오류 해결 과정

pq에 넣을때 **최적화된 값**을 넣지 않아서 **시간초과**가 나는 오류가 있었다...
고쳐서 바로 해결했다!

## 개선 방법

이미 **pq**를 사용해서 없을 것 같다!

## 풀이 코드

``` java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));

        StringTokenizer st =new StringTokenizer(br.readLine());

        int N = Integer.parseInt(st.nextToken());
        int M = Integer.parseInt(st.nextToken());

        int S = Integer.parseInt(br.readLine()); //출발 좌표

        List<int[]>[] cdn = new List[N+1]; // 인접리스트



        for (int i = 0; i < N + 1; i++) { 
            cdn[i] = new ArrayList<>();
        }

        for (int i = 0; i < M; i++) {
            st = new StringTokenizer(br.readLine());

            int s = Integer.parseInt(st.nextToken());//시작좌표
            int e = Integer.parseInt(st.nextToken());//도착좌표
            int v = Integer.parseInt(st.nextToken());//가중치

            cdn[s].add(new int[]{e,v});
        }

        int[] dt= new int[N+1];

        for (int i = 0; i < N + 1; i++) {
            dt[i] = Integer.MAX_VALUE;
        }

        Dijkstra(S,dt,cdn);

        StringBuilder sb = new StringBuilder();
        for (int i = 1; i <dt.length ; i++) {
            if(dt[i] == Integer.MAX_VALUE)sb.append("INF").append("\n");
            else sb.append(dt[i]).append("\n");
        }

        System.out.println(sb);
    }
    static void Dijkstra(int start,int[] dt,List<int[]>[] cdn){
        PriorityQueue<int[]> pq = new PriorityQueue<>((o1,o2) -> o1[1]-o2[1]);
        
        pq.add(new int[]{start,0});
        dt[start]=0;

        while(!pq.isEmpty()){
            int[]now = pq.poll();

            int e = now[0];
            int v = now[1];
            if(dt[e]<v)continue;

            for (int[] ints : cdn[e]) {
                int next = ints[0];
                int nextValue = ints[1];
                int nowValue = dt[e];
                if(dt[next]<=nowValue+nextValue)continue;
                if(dt[next]>nowValue+nextValue){
                    dt[next]=nowValue+nextValue;
                    pq.add(new int[]{next,nowValue+nextValue});
                }
            }
        }
        
    }
}
```
