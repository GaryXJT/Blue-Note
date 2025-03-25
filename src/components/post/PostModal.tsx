import React, { useState } from 'react'
import { Post } from '@/api/types'
import {
  CloseOutlined,
  LeftOutlined,
  RightOutlined,
  HeartOutlined,
  HeartFilled,
  PlusOutlined,
  CheckOutlined,
} from '@ant-design/icons'
import styles from './PostModal.module.scss'

interface PostModalProps {
  post: Post
  isOpen: boolean
  onClose: () => void
  isLiked?: boolean
  onLike?: (e: React.MouseEvent) => void
  likesCount?: number
}

const PostModal: React.FC<PostModalProps> = ({
  post,
  isOpen,
  onClose,
  isLiked = false,
  onLike,
  likesCount,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const images = post.images || [post.coverUrl]
  const displayLikes = likesCount !== undefined ? likesCount : post.likes

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const handleFollow = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsFollowing(!isFollowing)
    // 这里可以添加调用后端API的逻辑
    console.log(`${isFollowing ? '取消关注' : '关注'} ${post.author.name}`)
  }

  const handleLikeClick = (e: React.MouseEvent) => {
    if (onLike) {
      onLike(e)
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          <CloseOutlined />
        </button>

        <div className={styles.content}>
          <div className={styles.imageSection}>
            <div className={styles.imageWrapper}>
              <img
                src={images[currentIndex]}
                alt={`${post.title} - 图片 ${currentIndex + 1}`}
                className={styles.mainImage}
              />
            </div>
            {images.length > 1 && (
              <>
                <button
                  className={`${styles.navBtn} ${styles.prevBtn}`}
                  onClick={handlePrev}>
                  <LeftOutlined />
                </button>
                <button
                  className={`${styles.navBtn} ${styles.nextBtn}`}
                  onClick={handleNext}>
                  <RightOutlined />
                </button>
                <div className={styles.dots}>
                  {images.map((_, index) => (
                    <button
                      key={index}
                      className={`${styles.dot} ${
                        index === currentIndex ? styles.active : ''
                      }`}
                      onClick={() => setCurrentIndex(index)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <div className={styles.infoSection}>
            <div className={styles.header}>
              <h2>{post.title}</h2>
              <div className={styles.author}>
                <img src={post.author.avatar} alt={post.author.name} />
                <span>{post.author.name}</span>
                <button
                  className={`${styles.followBtn} ${
                    isFollowing ? styles.following : ''
                  }`}
                  onClick={handleFollow}>
                  {isFollowing ? (
                    <>
                      <CheckOutlined /> 已关注
                    </>
                  ) : (
                    <>
                      <PlusOutlined /> 关注
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className={styles.stats}>
              <div
                className={`${styles.likes} ${isLiked ? styles.liked : ''}`}
                onClick={handleLikeClick}>
                {isLiked ? <HeartFilled /> : <HeartOutlined />}
                <span>{displayLikes}</span>
              </div>
              <div className={styles.time}>
                {new Date(post.createdAt).toLocaleDateString()}
              </div>
            </div>

            <div className={styles.description}>{post.content}</div>

            <div className={styles.comments}>
              <h3>评论</h3>
              <div className={styles.commentForm}>
                <textarea placeholder="写下你的评论..." />
                <button>发送</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PostModal
