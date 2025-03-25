import React, { useState, useMemo } from 'react'
import { Post } from '@/api/types'
import { HeartOutlined, HeartFilled } from '@ant-design/icons'
import PostModal from '../post/PostModal'
import styles from './PostCard.module.scss'
import classNames from 'classnames'
import { Skeleton, Image } from 'antd'

interface PostCardProps {
  post: Post
}

// 骨架屏组件
export const PostCardSkeleton: React.FC = () => {
  return (
    <div className={styles.skeleton}>
      <div className={styles.imageWrapper}>
        <div className={styles.imageSkeleton} />
      </div>
      <div className={styles.content}>
        <div className={styles.titleSkeleton} />
        <div className={styles.authorSkeleton}>
          <div className={styles.avatarSkeleton} />
          <div className={styles.nameSkeleton} />
        </div>
      </div>
    </div>
  )
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(post.likes)

  // 计算图片容器的padding-bottom值，以保持原始宽高比
  const imageAspectRatio = useMemo(() => {
    if (!post.width || !post.height) return '100%' // 默认1:1比例

    // 根据图片原始宽高计算比例
    const ratio = (post.height / post.width) * 100
    return `${ratio}%`
  }, [post.width, post.height])

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation() // 阻止冒泡，避免同时打开Modal
    setIsLiked(!isLiked)
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1))
    // 这里可以添加调用后端API的逻辑
    console.log(`${isLiked ? '取消点赞' : '点赞'} 帖子: ${post.id}`)
  }

  return (
    <>
      <div className={styles.card} onClick={() => setIsModalOpen(true)}>
        <div
          className={styles.imageWrapper}
          style={{ paddingBottom: imageAspectRatio }}>
          {/* 使用 Ant Design 的 Image 组件实现预览和虚化效果 */}
          <Image
            src={post.coverUrl}
            alt={post.title}
            className={styles.image}
            loading="lazy"
            preview={false} // 禁用内置预览，因为我们使用自己的modal
            placeholder={
              <div className={styles.blurPlaceholder}>
                <Image
                  src={post.coverUrl}
                  preview={false}
                  className={styles.blurredImage}
                />
              </div>
            }
            onLoad={() => setImageLoaded(true)}
          />
          {/* 加载时显示骨架屏 */}
          {!imageLoaded && (
            <div className={styles.imageSkeleton}>
              <Skeleton.Image active className={styles.skeletonImage} />
            </div>
          )}
        </div>
        <div className={styles.content}>
          <h3 className={styles.title}>{post.title}</h3>
          <div className={styles.footer}>
            <div className={styles.author}>
              <div className={styles.info}>
                <div className={styles.avatar}>
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    loading="lazy"
                  />
                </div>
                <span className={styles.name}>{post.author.name}</span>
              </div>
              <div
                className={`${styles.likes} ${isLiked ? styles.liked : ''}`}
                onClick={handleLike}>
                {isLiked ? <HeartFilled /> : <HeartOutlined />}
                <span>{likesCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PostModal
        post={post}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isLiked={isLiked}
        onLike={handleLike}
        likesCount={likesCount}
      />
    </>
  )
}

export default PostCard
