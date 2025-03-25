import React, { useState } from 'react'
import { Card, Avatar, Tag, Space, message } from 'antd'
import { HeartOutlined, HeartFilled, CommentOutlined } from '@ant-design/icons'
import { postsAPI } from '@api/services'
import type { Post } from '../../types/api'
import styles from './PostCard.module.scss'

interface PostCardProps {
  post: Post
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(post.likes)

  // 处理点赞
  const handleLike = async () => {
    try {
      if (liked) {
        await postsAPI.unlikePost(post.postId)
        setLikes((prev) => prev - 1)
        message.success('取消点赞成功')
      } else {
        await postsAPI.likePost(post.postId)
        setLikes((prev) => prev + 1)
        message.success('点赞成功')
      }
      setLiked(!liked)
    } catch (error) {
      message.error('操作失败')
    }
  }

  return (
    <Card
      className={styles.card}
      cover={
        post.type === 'image' ? (
          <img alt={post.title} src={post.files[0]} className={styles.cover} />
        ) : (
          <video
            src={post.files[0]}
            className={styles.cover}
            controls
            preload="metadata"
          />
        )
      }>
      <Card.Meta
        avatar={<Avatar src={post.avatar} alt={post.nickname} />}
        title={post.title}
        description={
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div className={styles.content}>{post.content}</div>
            <div className={styles.tags}>
              {post.tags.map((tag) => (
                <Tag key={tag} color="blue">
                  {tag}
                </Tag>
              ))}
            </div>
            <div className={styles.actions}>
              <Space>
                <span className={styles.action} onClick={handleLike}>
                  {liked ? (
                    <HeartFilled style={{ color: '#ff4d4f' }} />
                  ) : (
                    <HeartOutlined />
                  )}
                  {likes}
                </span>
                <span className={styles.action}>
                  <CommentOutlined />
                  {post.comments}
                </span>
              </Space>
            </div>
          </Space>
        }
      />
    </Card>
  )
}

export default PostCard
