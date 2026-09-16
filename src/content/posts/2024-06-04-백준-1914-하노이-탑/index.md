---
title: "백준 1914: 하노이 탑"
description: "문제 링크N개의 하노이탑을 옮기려면 N-1개의 탑을 빈 공간에 옮긴후, 제일 큰 탑을 목적지로 이동 후, 다시 빈공간에서 목적지로 N-1개를 옮겨야한다.이는 N 개의 하노이 탑을 옮기기 위해서 N-1개의 하노이 탑을 옮기는걸 총 2번 반복해야된다는 소리고, 이는 재귀로"
date: 2024-06-04
category: algorithm
tags: ["Java", "백준", "알고리즘", "재귀"]
cover: ./cover.png
velogUrl: https://velog.io/@chae0738/%EB%B0%B1%EC%A4%80-1914-%ED%95%98%EB%85%B8%EC%9D%B4-%ED%83%91
---

[문제 링크](https://www.acmicpc.net/problem/1914)
# created : 2024-06-04

``` java
import java.math.BigInteger;
import java.util.*;
import java.io.*;
public class Main {
    public static void main(String[] args) throws IOException{
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));

        int N = Integer.parseInt(br.readLine());

        BigInteger ans = BigInteger.TWO.pow(N).subtract(BigInteger.ONE);
        System.out.println(ans);

        if(N<=20) Hanoi_Top(N,1,2,3);
    }

    static void Hanoi_Top(int N, int from, int temp, int to){
        if(N==1){
            System.out.println(from +" "+to);
            return;
        }



        Hanoi_Top(N-1,from,to,temp); // 자기 자신보다 작은 탑을 임시공간에 미리 이동시켜놔야함

        System.out.println(from +" "+to);

        Hanoi_Top(N-1,temp,from,to); // 임시공간에 이동한 탑들을 전부 목적지로 옮김

    }
}
```
## 떠올린 접근 방식, 과정

N개의 하노이탑을 옮기려면 N-1개의 탑을 빈 공간에 옮긴후, 제일 큰 탑을 목적지로 이동 후, 다시 빈공간에서 목적지로 N-1개를 옮겨야한다.
이는 **N 개의 하노이 탑을 옮기기 위해서 N-1개의 하노이 탑**을 옮기는걸 총 **2번 반복해야**된다는 소리고, 이는 `재귀`로 분할해서 풀 수 있다.

## 알고리즘과 판단 사유

`재귀`

## 시간복잡도

`O(N^2)`

## 오류 해결 과정

옮기는 과정을 써야해서 처음에는 스택으로 풀려다가 막혔다.
이후에 문제 유형을 확인하고 재귀로 풀었다!
## 개선 방법

없을 것 같다!
