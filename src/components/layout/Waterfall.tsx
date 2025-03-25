import React, { useEffect, useRef, useState } from 'react'
import PostCard, { PostCardSkeleton } from '../card/PostCard'
import styles from './Waterfall.module.scss'
import { Post } from '@/api/types'
import { Skeleton } from 'antd'

interface WaterfallProps {
  posts: Post[]
  loading: boolean
  onLoadMore: () => void
}

// 不同列数下的列宽百分比
const COLUMN_WIDTHS = {
  5: 18, // 5列时每列占18%，考虑间距
  4: 22, // 4列时每列占22%
  3: 30, // 3列时每列占30%
  2: 45, // 2列时每列占45%
  1: 90, // 1列时占90%
}

const GAP = 16 // 列间距

const Waterfall: React.FC<WaterfallProps> = ({
  posts,
  loading,
  onLoadMore,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [columns, setColumns] = useState(5)
  const [columnHeights, setColumnHeights] = useState<number[]>([])
  const [layout, setLayout] = useState<Post[][]>([])
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadingRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const resizeTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [initialLoading, setInitialLoading] = useState(posts.length === 0)

  // 计算列数
  const calculateColumns = () => {
    const windowWidth = window.innerWidth

    // 根据屏幕宽度决定列数
    if (windowWidth >= 1920) {
      setColumns(5)
      setColumnHeights(new Array(5).fill(0))
    } else if (windowWidth >= 1440) {
      setColumns(4)
      setColumnHeights(new Array(4).fill(0))
    } else if (windowWidth >= 768) {
      setColumns(3)
      setColumnHeights(new Array(3).fill(0))
    } else if (windowWidth >= 576) {
      setColumns(2)
      setColumnHeights(new Array(2).fill(0))
    } else {
      setColumns(1)
      setColumnHeights(new Array(1).fill(0))
    }
  }

  // 获取元素实际高度
  const getItemHeight = (post: Post): number => {
    const element = itemRefs.current.get(post.id)
    if (element) {
      return element.offsetHeight + GAP // 使用实际渲染的DOM元素高度
    }

    // 如果元素还未渲染，基于图片原始宽高比计算高度
    if (post.width && post.height) {
      const aspectRatio = post.height / post.width
      const containerWidth = containerRef.current?.offsetWidth || 1000
      const columnWidth = (containerWidth - GAP * (columns - 1)) / columns

      // 图片容器高度 + 内容区域高度 + 边距
      const imageHeight = columnWidth * aspectRatio
      const contentHeight = 120 // 标题、用户信息等内容的估计高度

      return imageHeight + contentHeight + GAP
    }

    // 没有宽高信息时的保守估计
    return (containerRef.current?.offsetWidth || 800) / columns + 120 + GAP
  }

  // 分配项目到最短的列
  const distributeItems = () => {
    if (!posts.length || columns === 0) return

    const newLayout: Post[][] = Array.from({ length: columns }, () => [])
    const heights = new Array(columns).fill(0)

    posts.forEach((post) => {
      const minHeight = Math.min(...heights)
      const shortestColumn = heights.indexOf(minHeight)
      newLayout[shortestColumn].push(post)
      heights[shortestColumn] += getItemHeight(post)
    })

    setLayout(newLayout)
    setColumnHeights(heights)
  }

  // 首次加载时显示骨架屏
  useEffect(() => {
    if (posts.length > 0 && initialLoading) {
      setInitialLoading(false)
    }
  }, [posts.length, initialLoading])

  // 监听窗口大小变化
  useEffect(() => {
    calculateColumns() // 初始计算

    const handleResize = () => {
      // 使用防抖处理，防止频繁触发
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current)
      }

      resizeTimerRef.current = setTimeout(() => {
        calculateColumns()
      }, 200)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current)
      }
    }
  }, [])

  // 当列数或帖子变化时，重新计算布局
  useEffect(() => {
    // 在下一帧进行布局计算，确保DOM已经更新
    requestAnimationFrame(() => {
      distributeItems()
    })
  }, [columns, posts])

  // 设置无限滚动
  useEffect(() => {
    if (!loadingRef.current) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore()
        }
      },
      { threshold: 0.1 }
    )

    observerRef.current.observe(loadingRef.current)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [loadingRef.current, onLoadMore])

  const columnWidth = COLUMN_WIDTHS[columns as keyof typeof COLUMN_WIDTHS]

  // 生成骨架屏
  const renderSkeletons = () => {
    const skeletons = []
    for (let i = 0; i < columns * 2; i++) {
      skeletons.push(<PostCardSkeleton key={`skeleton-${i}`} />)
    }
    return skeletons
  }

  return (
    <div className={styles.waterfall} ref={containerRef}>
      {initialLoading ? (
        // 初始加载骨架屏
        <div
          className={styles.skeletonContent}
          style={
            {
              '--columns': columns,
              '--gap': `${GAP}px`,
              '--column-width': `${columnWidth}%`,
            } as any
          }>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={`skeleton-column-${colIndex}`} className={styles.column}>
              {Array.from({ length: 2 }).map((_, index) => (
                <PostCardSkeleton key={`skeleton-${colIndex}-${index}`} />
              ))}
            </div>
          ))}
        </div>
      ) : (
        // 实际内容
        <div
          className={styles.content}
          style={
            {
              '--columns': columns,
              '--gap': `${GAP}px`,
              '--column-width': `${columnWidth}%`,
            } as any
          }>
          {layout.map((column, columnIndex) => (
            <div key={`column-${columnIndex}`} className={styles.column}>
              {column.map((post) => (
                <div
                  key={post.id}
                  ref={(el) => {
                    if (el) {
                      itemRefs.current.set(post.id, el)
                    } else {
                      itemRefs.current.delete(post.id)
                    }
                  }}>
                  <PostCard post={post} />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <div ref={loadingRef} className={styles.loading}>
        {loading && (
          <>
            <div className={styles.spinner} />
            <span>加载中...</span>
          </>
        )}
      </div>
    </div>
  )
}

export default Waterfall
