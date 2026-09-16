---
title: "백준 1938: 통나무 옮기기"
description: "문제 링크최단경로이므로 BFS에 기본 로직들에 맞춰 조건을 구현했다.BFS최단경로니까!O(N^2)방문처리를 한 조건에 안해줘서 메모리 초과가 났었다.바로 추가해줘서 해결했다!더 깔끔하게 리팩토링은 가능할 것 같다.."
date: 2024-06-06
category: algorithm
tags: ["BFS", "Java", "백준", "알고리즘"]
cover: ./cover.png
velogUrl: https://velog.io/@chae0738/%EB%B0%B1%EC%A4%80-1938-%ED%86%B5%EB%82%98%EB%AC%B4-%EC%98%AE%EA%B8%B0%EA%B8%B0
---

[문제 링크](https://www.acmicpc.net/problem/1938)
# created : 2024-06-06


## 떠올린 접근 방식, 과정

**최단경로**이므로 BFS에 기본 로직들에 맞춰 **조건을 구현**했다.

## 알고리즘과 판단 사유

`BFS`
**최단경로**니까!
## 시간복잡도

O(N^2)

## 오류 해결 과정

방문처리를 한 조건에 안해줘서 **메모리 초과**가 났었다.
바로 추가해줘서 해결했다!
## 개선 방법

더 깔끔하게 **리팩토링**은 가능할 것 같다..



## 풀이 코드 
``` java
import java.io.*;
import java.util.*;
public class Main {
    static int ans;

    public static void main(String[] args) throws IOException{
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));

        int N = Integer.parseInt(br.readLine()); // 배열 크기

        int[][] arr =new int[N][N];


        int[][] start = new int[3][2];
        int[][] end = new int[3][2];

        int idx_start = 0;
        int idx_end = 0;

        for (int i = 0; i < N; i++) {
            String s = br.readLine();
            for (int j = 0; j < N; j++) {
                if(s.charAt(j)=='B'){
                    arr[i][j]=0;  // 시작점 -1
                     start[idx_start][0]= i;
                     start[idx_start++][1]=j;// 좌표 미리 저장
                }
                else if(s.charAt(j)=='E'){
                    arr[i][j]=0; // 목표지점 -2
                    end[idx_end][0]=i;
                    end[idx_end++][1]=j;// 좌표 미리 저장
                }
                else arr[i][j]=Integer.parseInt(s.charAt(j)+"");
            }
        }


        BFS(start,end,arr);

        System.out.println(ans);

    }

    static void BFS(int[][] start, int[][] end,int[][]arr){
        Queue<Cdn> que = new LinkedList<>();
        Set<String> visited = new HashSet<>(); // 중복체크 방지

        que.add(new Cdn(start,0));
        visited.add(Arrays.toString(start));

        int[][] dx = {{1,0},{-1,0},{0,1},{0,-1}}; // 하, 상, 우 , 좌

        while(!que.isEmpty()){
            Cdn cdn = que.poll();
            int[][] now = cdn.cdn;
            if(Arrays.deepEquals(now,end)){
                ans=cdn.cnt;
                break;
            }
            for (int i = 0; i < 5; i++) {

                int[][] next = new int[3][2];

                boolean check = true;

                if(i<4) {
                    for (int j = 0; j < now.length; j++) {
                        int delY = now[j][0] + dx[i][0];
                        int delX = now[j][1] + dx[i][1];

                        if (delX < 0 || delY < 0 || delX >= arr.length || delY >= arr.length) {
                            check = false;
                            break;
                        }
                        if (arr[delY][delX] == 1) {
                            check = false;
                            break;
                        }
                        next[j][0] = delY;
                        next[j][1] = delX;
                    }
                }else{
                    int firstY = now[0][0];
                    int firstX = now[0][1];

                    int midY = now[1][0];
                    int midX = now[1][1];

                    int lastY = now[2][0];
                    int lastX = now[2][1];

                    int[][] dx2 = {{0,1},{0,-1},{1,0},{-1,0},{-1,1},{1,1},{-1,-1},{1,-1}}; // 8방향 검사

                    for (int j = 0; j < dx2.length; j++) {
                        int delY = midY + dx2[j][0];
                        int delX = midX + dx2[j][1];

                        if(delY < 0 || delX < 0 || delX >= arr.length || delY >= arr.length){
                            check = false;
                            break;
                        }
                        if (arr[delY][delX] == 1) {
                            check = false;
                            break;
                        }
                    }

                    if(check){
                        if(Math.abs(firstY-midY)==1){
                            next[0][0]=firstY+1;
                            next[0][1]=firstX-1;

                            next[1][0] = midY;
                            next[1][1]=midX;

                            next[2][0]=lastY-1;
                            next[2][1]=lastX+1;
                        }else{
                            next[0][0]=firstY-1;
                            next[0][1]=firstX+1;


                            next[1][0] = midY;
                            next[1][1]=midX;

                            next[2][0]=lastY+1;
                            next[2][1]=lastX-1;
                        }
                        int v = cdn.cnt+1;
                        if(visited.contains(Arrays.deepToString(next)))continue;
                        que.add(new Cdn(next,v));
                    }
                }
                if(check){
                    if(visited.contains(Arrays.deepToString(next)))continue; // 2차원 배열은 deepToString 써야함
                    int v = cdn.cnt+1;
                    que.add(new Cdn(next,v));
                    visited.add(Arrays.deepToString(next));
                }
            }
        }
    }

    static class Cdn {
        int[][] cdn;
        int cnt ;

        public Cdn(int[][] cdn, int cnt) {
            this.cdn = cdn;
            this.cnt = cnt;
        }
    }
}
```
