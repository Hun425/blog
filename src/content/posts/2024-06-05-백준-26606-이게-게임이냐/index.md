---
title: "백준 26606: 이게 게임이냐?"
description: "문제 링크기본 로직은 BFS로 pq에 카드 게임 진행상황과 현재 카드 소비수를 같이 넣어서, 카드 소비수를 내림차순 기준으로 뽑아내고, 카드를 넣을 수 있는 모든 곳의 수를 탐색해서 게임 성공 유무를 판단한다.BFSO(NlogN)처음에 구현할 때는 손패를 고려안해서"
date: 2024-06-05
category: algorithm
tags: ["BFS", "Java", "백준", "알고리즘"]
cover: ./cover.png
velogUrl: https://velog.io/@chae0738/%EB%B0%B1%EC%A4%80-26606-%EC%9D%B4%EA%B2%8C-%EA%B2%8C%EC%9E%84%EC%9D%B4%EB%83%90
---

[문제 링크](https://www.acmicpc.net/problem/26606)
# created : 2024-06-05

``` java
package baekjoon;  
import java.util.*;  
  
import java.io.*;  
  
public class __26606 {  
    public static void main(String[] args) throws IOException {  
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));  
  
        int N = Integer.parseInt(br.readLine());  
  
        int[][] card = new int[N / 2][2];  
  
        for (int i = 0; i < N / 2; i++) {  
            StringTokenizer st = new StringTokenizer(br.readLine());  
            for (int j = 0; j < 2; j++) {  
                card[i][j] = Integer.parseInt(st.nextToken());  
            }  
        }  
  
        if (PlayGame(card, N)) {  
            System.out.println("WIN");  
        } else {  
            System.out.println("LOSE");  
        }  
    }  
  
    static Boolean PlayGame(int[][] card, int N) {  
        PriorityQueue<int[]> state = new PriorityQueue<>((o1, o2) -> o2[4] - o1[4]);  
        Set<String> visited = new HashSet<>();  
  
        int[] playing = {0, 0, 101, 101, 0};  
        state.add(playing);  
        visited.add(Arrays.toString(playing));  
  
        while (!state.isEmpty()) {  
            int[] now = state.poll();  
            int idx = now[4];  
            if (now[4] == N) return true;  
            int[] v = card[idx / 2];  
  
            processState(now, v, state, visited);  
            int temp = v[0];  
            v[0] = v[1];  
            v[1] = temp;  
            processState(now, v, state, visited);  
        }  
  
        return false;  
    }  
  
    private static void processState(int[] now, int[] v, PriorityQueue<int[]> state, Set<String> visited) {  
        for (int i = 0; i < 4; i++) {  
            if ((i < 2 && (now[i] < v[0] || now[i] - 10 == v[0])) || (i >= 2 && (now[i] > v[0] || now[i] + 10 == v[0]))) {  
                int[] next = now.clone();  
                next[i] = v[0];  
                next[4]++;  
                addState(next, v, state, visited);  
            }  
        }  
    }  
  
    private static void addState(int[] next, int[] v, PriorityQueue<int[]> state, Set<String> visited) {  
        for (int j = 0; j < 4; j++) {  
            if ((j < 2 && (next[j] < v[1] || next[j] - 10 == v[1])) || (j >= 2 && (next[j] > v[1] || next[j] + 10 == v[1]))) {  
                int[] result = next.clone();  
                result[j] = v[1];  
                result[4]++;  
                if (!visited.contains(Arrays.toString(result))) {  
                    state.add(result);  
                    visited.add(Arrays.toString(result));  
                }  
            }  
        }  
    }  
}
```
## 떠올린 접근 방식, 과정

기본 로직은 BFS로 pq에 카드 게임 진행상황과 현재 카드 소비수를 같이 넣어서, 
카드 소비수를 **내림차순** 기준으로  뽑아내고, 
카드를 넣을 수 있는 **모든 곳의 수를 탐색해**서 게임 **성공 유무**를 판단한다.

## 알고리즘과 판단 사유

`BFS`

## 시간복잡도

`O(NlogN)`

## 오류 해결 과정

처음에 구현할 때는 손패를 고려안해서 틀렸다.
원인을 알고 로직을 고쳤더니 시간초과가 났다...
시간초과가 난 이후에 큐에 중복되는 로직을 처리하는 메서드를 추가해서 해결했다!
## 개선 방법

잘 모르겠다..
