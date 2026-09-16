// 빈 문자열이면 해당 기능(GA4/giscus)은 렌더되지 않는다.
export const SITE = {
  title: 'hun425.log',
  description: '백엔드 개발자 Hun의 기술 블로그. Java·Kotlin·Spring, CS, 인프라, 알고리즘, 커리어.',
  author: 'Hun425',
  lang: 'ko',
  resumeUrl: 'https://hun425.github.io/',
  githubUrl: 'https://github.com/Hun425',
  velogUrl: 'https://velog.io/@chae0738',
  ga4Id: '',
  giscus: {
    repo: 'Hun425/blog',
    repoId: 'R_kgDOUdtZWA',
    category: 'Announcements',
    categoryId: 'DIC_kwDOUdtZWM4DFv6c',
  },
} as const;
