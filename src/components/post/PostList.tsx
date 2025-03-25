import React, { useState, useEffect } from 'react'
import { Select, Input, Spin, Empty, message, Pagination } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { postsAPI } from '@api/services'
import type { Post as ApiPost } from '../../types/api'
import PostCard from './PostCard'
import styles from './PostList.module.scss'

const { Option } = Select

interface PostListProps {
  userId?: string
  type?: 'image' | 'video'
  tag?: string
  status?: 'draft' | 'pending' | 'approved' | 'rejected'
}

const PostList: React.FC<PostListProps> = ({ userId, type, tag, status }) => {
  const [posts, setPosts] = useState<ApiPost[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [current, setCurrent] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchText, setSearchText] = useState('')

  // 获取帖子列表
  const fetchPosts = async (pageNum?: number) => {
    setLoading(true)
    try {
      const response = await postsAPI.getPosts({
        page: pageNum || current,
        limit: pageSize,
        status: 'published',
        ...(type && { type }),
        ...(tag && { tag }),
        ...(userId && { userId }),
        ...(searchText && { search: searchText })
      })
      setPosts(response.data.posts as any)
      setTotal(response.data.total)
      setLoading(false)
    } catch (error) {
      console.error('获取帖子列表失败:', error)
      message.error('获取帖子列表失败')
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts(1)
  }, [type, tag, status, userId, pageSize])

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchText(value)
    setCurrent(1)
    // TODO: 实现搜索功能
  }

  // 处理分页变化
  const handlePageChange = (page: number) => {
    setCurrent(page)
    fetchPosts(page)
  }

  // 处理每页数量变化
  const handlePageSizeChange = (current: number, size: number) => {
    setPageSize(size)
    setCurrent(1)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Input
          placeholder="搜索帖子"
          prefix={<SearchOutlined />}
          onChange={(e) => handleSearch(e.target.value)}
          className={styles.searchInput}
        />
        <Select
          value={type}
          onChange={(value) => setCurrent(1)}
          placeholder="选择类型"
          className={styles.typeSelect}>
          <Option value="image">图片</Option>
          <Option value="video">视频</Option>
        </Select>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <Spin size="large" />
        </div>
      ) : posts.length > 0 ? (
        <>
          <div className={styles.grid}>
            {posts.map((post) => (
              <PostCard key={post.postId} post={post} />
            ))}
          </div>
          <div className={styles.pagination}>
            <Pagination
              current={current}
              total={total}
              pageSize={pageSize}
              onChange={handlePageChange}
              onShowSizeChange={handlePageSizeChange}
              showSizeChanger
              showQuickJumper
            />
          </div>
        </>
      ) : (
        <Empty description="暂无帖子" />
      )}
    </div>
  )
}

export default PostList
