import React, { useState } from 'react'
import { Input, Button, message } from 'antd'
import { SmileOutlined } from '@ant-design/icons'
import styles from './CommentInput.module.scss'

const { TextArea } = Input

interface CommentInputProps {
  onSubmit: (content: string) => Promise<void>
  placeholder?: string
  maxLength?: number
  submitting?: boolean
}

const CommentInput: React.FC<CommentInputProps> = ({
  onSubmit,
  placeholder = '写下你的评论...',
  maxLength = 500,
  submitting = false,
}) => {
  const [content, setContent] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)

  // 表情列表
  const emojis = [
    '😊',
    '😂',
    '🤔',
    '👍',
    '❤️',
    '🎉',
    '🌟',
    '💪',
    '😍',
    '😭',
    '😅',
    '😆',
    '😉',
    '😋',
    '😎',
    '😡',
    '😢',
    '😣',
    '😤',
    '😥',
    '😦',
    '😧',
    '😨',
    '😩',
    '😪',
    '😫',
    '😬',
    '😭',
    '😮',
    '😯',
    '😰',
    '😱',
  ]

  // 插入表情
  const insertEmoji = (emoji: string) => {
    setContent((prev) => prev + emoji)
    setShowEmoji(false)
  }

  // 提交评论
  const handleSubmit = async () => {
    if (!content.trim()) {
      message.warning('请输入评论内容')
      return
    }

    try {
      await onSubmit(content)
      setContent('')
    } catch (error) {
      // 错误已在父组件中处理
    }
  }

  return (
    <div className={styles.commentInput}>
      <div className={styles.inputWrapper}>
        <TextArea
          rows={3}
          placeholder={placeholder}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={maxLength}
          showCount
        />
        <div className={styles.actions}>
          <Button
            type="text"
            icon={<SmileOutlined />}
            onClick={() => setShowEmoji(!showEmoji)}
          />
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={submitting}
            disabled={!content.trim()}>
            发表评论
          </Button>
        </div>
      </div>
      {showEmoji && (
        <div className={styles.emojiPanel}>
          {emojis.map((emoji, index) => (
            <span
              key={index}
              className={styles.emoji}
              onClick={() => insertEmoji(emoji)}>
              {emoji}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default CommentInput
