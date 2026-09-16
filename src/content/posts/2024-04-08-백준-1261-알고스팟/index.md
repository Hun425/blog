---
title: "백준 1261: 알고스팟"
description: "1261번: 알고스팟(0,0)에서 (M,N)까지 가는데 드는 최소 비용(벽의 최소치)를 구해야 하기 때문에 최소 배열을 하나 만든 후, BFS로 이동하면서 최소치를 갱신해준다단, 갱신할 필요가 없는 경우 추가로 이동하지 않도록 제한을 건다시간 복잡도를 최소화 하기 위해"
date: 2024-04-08
category: algorithm
tags: []
cover: ./cover.png
velogUrl: https://velog.io/@chae0738/%EB%B0%B1%EC%A4%80-1261-%EC%95%8C%EA%B3%A0%EC%8A%A4%ED%8C%9F
---

[1261번: 알고스팟](https://www.acmicpc.net/problem/1261)


## 정답 코드

``` java
package baekjoon;  
import java.util.*;  
import java.io.*;  
public class __1261 {  
    static int N,M;  
    public static void main(String[] args) throws IOException{  
        BufferedReader br =new BufferedReader(new InputStreamReader(System.in));  
        StringBuilder sb= new StringBuilder();  
  
        StringTokenizer st = new StringTokenizer(br.readLine());  
  
        N = Integer.parseInt(st.nextToken());  
        M = Integer.parseInt(st.nextToken());  
  
        int [][] map = new int[M][N];  
  
        for (int i = 0; i < M; i++) {  
            String s = br.readLine();  
            for (int j = 0; j < N; j++) {  
                map[i][j] = Integer.parseInt(String.valueOf(s.charAt(j)));  
            }  
        }  
  
        int [][] minMap = new int[M][N];  
  
        for (int i = 0; i < M; i++) {  
            for (int j = 0; j < N; j++) {  
                minMap[i][j] = Integer.MAX_VALUE;  
            }  
        }  
  
        minMap[0][0]=0;  
  
        Dijkstra(minMap,map);  
  
        System.out.println(minMap[M-1][N-1] );  
    }  
  
    static void Dijkstra(int[][]minMap,int[][]map) {  
        PriorityQueue<Integer[]>que = new PriorityQueue<>((o1, o2) -> o1[2]-o2[2]);  
  
        que.add(new Integer[]{0,0,0});  
  
        int[][] dx = {{0, 1}, {0, -1}, {1, 0}, {-1, 0}};  
  
        while (!que.isEmpty()) {  
            Integer[] now = que.poll();  
  
            for (int i = 0; i < 4; i++) {  
                int y = now[0]+dx[i][0];  
                int x = now[1]+dx[i][1];  
  
                if(y<0 || y>=M || x<0 || x>=N) continue;  
  
                int weight = now[2]+map[y][x];  
  
                if(weight>=minMap[y][x])continue;  
  
                minMap[y][x]=weight;  
                que.add(new Integer[]{y,x,weight});  
  
            }  
        }  
    }  
}
```
## 떠올린 접근 방식, 과정

(0,0)에서 (M,N)까지 가는데 드는 최소 비용`(벽의 최소치)`를 구해야 하기 때문에 

최소 배열을 하나 만든 후, **BFS로 이동하면서 최소치를 갱신**해준다

단, 갱신할 필요가 없는 경우 추가로 이동하지 않도록 제한을 건다

시간 복잡도를 최소화 하기 위해서, 우선순위 큐를 가중치 기준으로 사용한다
## 알고리즘 판단 사유

다익스트라`(dijkstra)`

시작점이 정해져있고, 가야하는 구간까지의 **최소 경로**를 구해야 하기 때문이다
## 시간 복잡도

대략 정점 개수 M*N, 간선 개수 4MN 이므로
O(MNlog(MN)) `정확하지 않음`

## 오류 해결 과정

99% 에서 틀리는 문제가 발생했고 반례를 찾았다

Min 배열의 시작점 값을 0으로 초기화 하지 않았더니

입력값이 
`1 1`
`0`     
인 경우에 MAX값으로 나오는 오류가 있었다

Min 배열을 초기화 한 이후에 시작점을 0으로 설정해 주어 해결했다
## 개선 방법

떠오르지 않는다...
