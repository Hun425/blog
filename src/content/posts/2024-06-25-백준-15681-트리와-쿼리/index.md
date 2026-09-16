---
title: "백준 15681 : 트리와 쿼리"
description: "문제 링크인접 리스트를 순회하는 방식만 구현하면 된다고 생각해서, DFS나 BFS로 접근했다DFSO(V+E)처음에는 메모리를 고려하지 않고 BFS를 사용했다가 메모리 초과가 난 이후에 DFS로 바꿨다!DP도 가능할 것 같다!"
date: 2024-06-25
category: algorithm
tags: ["Java", "알고리즘"]
cover: ./cover.png
velogUrl: https://velog.io/@chae0738/%EB%B0%B1%EC%A4%80-15681-%ED%8A%B8%EB%A6%AC%EC%99%80-%EC%BF%BC%EB%A6%AC
---

[문제 링크](https://www.acmicpc.net/problem/15681)
# created : 2024-06-25

## 문제
![](./img-01.png)



## 떠올린 접근 방식, 과정
인접 리스트를 순회하는 방식만 구현하면 된다고 생각해서, `DFS`나 `BFS`로 접근했다


## 알고리즘과 판단 사유
`DFS`


## 시간복잡도
`O(V+E)`


## 오류 해결 과정
처음에는 메모리를 고려하지 않고 BFS를 사용했다가 메모리 초과가 난 이후에 `DFS`로 바꿨다!

## 개선 방법
DP도 가능할 것 같다!

## 풀이 코드

``` java
import java.util.*;  
import java.io.*;  
  
public class Main {  
    static int[] subtreeSize;  
    static List<Integer>[] cdn;  
    static boolean[] visited;  
  
    public static void main(String[] args) throws IOException {  
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));  
  
        StringTokenizer st = new StringTokenizer(br.readLine());  
  
        int N = Integer.parseInt(st.nextToken());  
        int R = Integer.parseInt(st.nextToken());  
        int Q = Integer.parseInt(st.nextToken());  
  
        cdn = new List[N + 1];  
        subtreeSize = new int[N + 1];  
        visited = new boolean[N + 1];  
  
        for (int i = 0; i < N + 1; i++) {  
            cdn[i] = new ArrayList<>();  
        }  
  
        for (int i = 0; i < N - 1; i++) {  
            st = new StringTokenizer(br.readLine());  
  
            int s = Integer.parseInt(st.nextToken());  
            int e = Integer.parseInt(st.nextToken());  
  
            cdn[s].add(e);  
            cdn[e].add(s);  
        }  
  
    DFS(R);  
  
        StringBuilder sb = new StringBuilder();  
        for (int i = 0; i < Q; i++) {  
            int s = Integer.parseInt(br.readLine());  
            sb.append(subtreeSize[s]).append("\n");  
        }  
  
        System.out.println(sb);  
    }  
  
    static int DFS(int node) {  
        visited[node] = true;  
        subtreeSize[node] = 1;   
        for (int neighbor : cdn[node]) {  
            if (!visited[neighbor]) {  
                subtreeSize[node] += DFS(neighbor);  
            }  
        }  
  
        return subtreeSize[node];  
    }  
}
```
