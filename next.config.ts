import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ['image/webp', 'image/avif'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // 클릭재킹 방지: iframe 삽입 차단
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // MIME 스니핑 방지
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // URL에 접근 토큰이 있으므로 Referer를 외부로 보내지 않음
          {
            key: 'Referrer-Policy',
            value: 'no-referrer',
          },
          // 검색 노출 차단(F004): layout.tsx의 robots 메타와 이중 적용
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
    ]
  },
}

export default nextConfig
