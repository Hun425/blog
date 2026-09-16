---
title: "백준 26609: 험난한 등굣길"
description: "문제 링크문제의 범위가 3000이고, 해당 조건의 교통체중을 전부다 BFS로 일일히 돌리면 시간초과가 난다. 따라서 교통체중의 경계값만 표시하고 학교를 가는 최소값은 다익스트라를 사용한다.다익스트라구현우선순위큐로 최적화를 시키지 않았기 때문에O(N^2)일반 BFS로 해"
date: 2024-06-02
category: algorithm
tags: ["Java", "알고리즘"]
cover: ./cover.png
velogUrl: https://velog.io/@chae0738/%EB%B0%B1%EC%A4%80-%ED%97%98%EB%82%9C%ED%95%9C-%EB%93%B1%EA%B5%A3%EA%B8%B8
---

[문제 링크](https://www.acmicpc.net/problem/26009)
# created : 2024-06-03

``` java
import java.util.*;
import java.io.*;
public class Main {

    static int N,M;
    public static void main(String[] args) throws IOException{
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));

        StringTokenizer st = new StringTokenizer(br.readLine());

        N = Integer.parseInt(st.nextToken());
        M = Integer.parseInt(st.nextToken());

        int[][] arr = new int[N][M];

        for (int i = 0; i < N; i++) {
            for (int j = 0; j < M; j++) {
                arr[i][j] = Integer.MAX_VALUE; // 최소거리 계산위해 최대값으로 초기화
            }
        }

        int K = Integer.parseInt(br.readLine());


        for (int i = 0; i < K; i++) {
            st = new StringTokenizer(br.readLine());

            int y = Integer.parseInt(st.nextToken())-1;
            int x = Integer.parseInt(st.nextToken())-1;
            int v = Integer.parseInt(st.nextToken());

            traffic(y,x,v,arr);
        }

        GoToSchool(arr);

        if(arr[N-1][M-1]==Integer.MAX_VALUE) System.out.println("NO");
        else {
            System.out.println("YES");
            System.out.println(arr[N-1][M-1]);
        }

    }

    static void traffic(int y, int x, int v,int[][]arr){
        int[][] dx = {{1,-1},{1,1},{-1,1},{-1,-1}};

        y = y-v; // 마름모 모양으로 테두리만 검사할 것!

        if(y<N && y>=0 && x<M && x>=0)arr[y][x]=-1;

        for (int i = 0; i < v; i++) {
            y = y+dx[0][0];
            x = x+dx[0][1];
            if(y<N && y>=0 && x<M && x>=0)arr[y][x]=-1;
        }

        for (int i = 0; i < v; i++) {
            y = y+dx[1][0];
            x = x+dx[1][1];
            if(y<N && y>=0 && x<M && x>=0)arr[y][x]=-1;
        }

        for (int i = 0; i < v; i++) {
            y = y+dx[2][0];
            x = x+dx[2][1];
            if(y<N && y>=0 && x<M && x>=0)arr[y][x]=-1;
        }

        for (int i = 0; i < v; i++) {
            y = y+dx[3][0];
            x = x+dx[3][1];
            if(y<N && y>=0 && x<M && x>=0)arr[y][x]=-1;
        }

    }

    static void GoToSchool(int[][] arr){
        Queue<Integer[]> q = new ArrayDeque<>();

        int[][]dx = {{0,1},{1,0},{0,-1},{-1,0}};

        q.add(new Integer[]{0,0,0});
        arr[0][0] = 0;
        while(!q.isEmpty()){
            Integer[] temp = q.poll();

            int dt = temp[2];

            for (int i = 0; i < 4; i++) {
                int del_y = temp[0] + dx[i][0];
                int del_x = temp[1] + dx[i][1];

                if(del_y>=N || del_x>=M || del_y<0 || del_x<0) continue;
                if(arr[del_y][del_x]==-1)continue;
                if(dt+1>=arr[del_y][del_x])continue;

                arr[del_y][del_x] = dt+1;
                q.add(new Integer[]{del_y,del_x,dt+1});
            }
        }
    }
}
```
## 떠올린 접근 방식, 과정

문제의 범위가 3000이고, 해당 조건의 교통체중을 전부다 BFS로 일일히 돌리면 시간초과가 난다. 따라서 교통체중의 경계값만 표시하고 학교를 가는 최소값은 다익스트라를 사용한다.

## 알고리즘과 판단 사유

`다익스트라`
`구현`

## 시간복잡도

우선순위큐로 최적화를 시키지 않았기 때문에
`O(N^2)`

## 오류 해결 과정

일반 BFS로 해서 시간초과가 났다.
시간초과가 나는 부분을 개선하기 위해서 BFS대신 일반 구현을 사용했다

## 개선 방법

다익스트라 로직을 최적화 시킬 수 있다.
