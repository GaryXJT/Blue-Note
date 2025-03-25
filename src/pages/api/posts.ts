import type { NextApiRequest, NextApiResponse } from 'next'
import { Post } from '../../../api/types'

// 模拟数据
const mockPosts: Post[] = Array(50)
  .fill(0)
  .map((_, index) => ({
    id: `${index + 1}`,
    title: `测试帖子 ${index + 1}`,
    content: `这是测试帖子 ${
      index + 1
    } 的内容，这里可以写很多很多文字来测试长文本的显示效果。`,
    coverUrl: `https://picsum.photos/400/${300 + (index % 3) * 100}`,
    images: [
      `https://picsum.photos/400/${300 + (index % 3) * 100}`,
      `https://picsum.photos/400/${400 + (index % 3) * 100}`,
      `https://picsum.photos/400/${500 + (index % 3) * 100}`,
    ],
    height: 300 + (index % 3) * 100,
    width: 400,
    author: {
      id: '1',
      name: '测试用户',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
    },
    likes: Math.floor(Math.random() * 1000),
    createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
    updatedAt: new Date().toISOString(),
  }))

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '方法不允许' })
  }

  const page = Number(req.query.page) || 1
  const pageSize = Number(req.query.pageSize) || 12
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const items = mockPosts.slice(start, end)

  res.status(200).json({
    code: 0,
    message: 'success',
    data: {
      list: items,
      total: mockPosts.length,
      page,
      pageSize,
      hasMore: end < mockPosts.length,
    },
  })
}
