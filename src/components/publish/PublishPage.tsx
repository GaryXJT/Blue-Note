import React, { useState, useRef } from 'react'
import { message, Popover, Button } from 'antd'
import { LeftOutlined, SmileOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd'
import ImageWall from './ImageWall'
import styles from './PublishPage.module.scss'

// 常用表情列表
const emojiList = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', 
  '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', 
  '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
  '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
  '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮'
]

interface PublishPageProps {
  initialImages: File[]
  onBack: () => void
  onPublish?: () => void
}

// 辅助函数：将 File[] 转换为 UploadFile[]
const convertFilesToUploadFiles = (files: File[] | undefined): UploadFile[] => {
  if (!files) return []
  return files.map((file, index) => ({
    uid: `-${index}`,
    name: file.name,
    status: 'done' as const,
    url: URL.createObjectURL(file),
    originFileObj: file as any,
  }))
}

const PublishPage: React.FC<PublishPageProps> = ({
  initialImages,
  onBack,
  onPublish,
}) => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [textLength, setTextLength] = useState(0)
  const contentInputRef = useRef<HTMLTextAreaElement>(null)
  // 初始化时直接转换初始图片
  const [imageFiles, setImageFiles] = useState<UploadFile[]>(() =>
    convertFilesToUploadFiles(initialImages)
  )

  // 处理标题变化
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
  }

  // 处理内容变化
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
    setTextLength(newContent.length)
  }

  // 处理标题中的表情选择
  const handleTitleEmojiSelect = (emoji: string) => {
    // 在标题框中的当前位置插入表情
    const titleInput = document.querySelector(
      'input[type="text"]'
    ) as HTMLInputElement
    if (titleInput) {
      const start = titleInput.selectionStart || 0
      const end = titleInput.selectionEnd || 0

      // 检查添加表情后是否会超过20个字符
      if (title.length + emoji.length > 20) {
        message.warning('标题最多20个字')
        return
      }

      // 创建新的标题文本，在光标位置插入表情
      const newTitle = title.substring(0, start) + emoji + title.substring(end)
      setTitle(newTitle)

      // 更新光标位置到表情后面
      setTimeout(() => {
        titleInput.focus()
        titleInput.setSelectionRange(start + emoji.length, start + emoji.length)
      }, 0)
    }
  }

  // 处理正文中的表情选择
  const handleContentEmojiSelect = (emoji: string) => {
    if (contentInputRef.current) {
      const textarea = contentInputRef.current
      const start = textarea.selectionStart || 0
      const end = textarea.selectionEnd || 0

      // 检查添加表情后是否会超过1000个字符
      if (content.length + emoji.length > 1000) {
        message.warning('正文最多1000个字')
        return
      }

      // 创建新的正文内容，在光标位置插入表情
      const newContent =
        content.substring(0, start) + emoji + content.substring(end)
      setContent(newContent)
      setTextLength(newContent.length)

      // 更新光标位置到表情后面
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + emoji.length, start + emoji.length)
      }, 0)
    }
  }

  // 处理图片变化
  const handleImagesChange = (files: UploadFile[]) => {
    setImageFiles(files)
  }

  // 处理清空图片
  const handleClearImages = () => {
    setImageFiles([])
  }

  // 处理发布
  const handlePublish = () => {
    if (imageFiles.length === 0) {
      message.error('请至少上传一张图片')
      return
    }

    if (!title) {
      message.error('请输入标题')
      return
    }

    if (!content) {
      message.error('请输入正文内容')
      return
    }

    if (textLength > 1000) {
      message.error('正文内容超出字数限制')
      return
    }

    // TODO: 实际发布逻辑
    console.log('发布内容:', {
      title,
      content,
      images: imageFiles,
    })

    message.success('发布成功')

    if (onPublish) {
      onPublish()
    }
  }

  // 保存草稿
  const handleSaveDraft = () => {
    message.success('草稿保存成功')
  }

  // 表情选择器内容（标题）
  const titleEmojiContent = (
    <div className={styles.emojiGrid}>
      {emojiList.map((emoji, index) => (
        <button
          key={index}
          className={styles.emojiItem}
          onClick={() => handleTitleEmojiSelect(emoji)}>
          {emoji}
        </button>
      ))}
    </div>
  )

  // 表情选择器内容（正文）
  const contentEmojiContent = (
    <div className={styles.emojiGrid}>
      {emojiList.map((emoji, index) => (
        <button
          key={index}
          className={styles.emojiItem}
          onClick={() => handleContentEmojiSelect(emoji)}>
          {emoji}
        </button>
      ))}
    </div>
  )

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.content}>
          {/* 添加返回按钮 */}
          <div className={styles.backButton}>
            <div className={styles.backIconWrapper} onClick={onBack}>
              <LeftOutlined className={styles.backIcon} />
            </div>
            <span className={styles.pageTitle}>发布笔记</span>
          </div>

          {/* 图片上传区域 */}
          <div className={styles.imageSection}>
            <div className={styles.imageHeader}>
              <div className={styles.imageTitle}>
                <span>图片</span>
                <span className={styles.imageCounter}>({imageFiles.length}/9)</span>
              </div>
              {imageFiles.length > 0 && (
                <a className={styles.clearLink} onClick={handleClearImages}>
                  清空并重新上传
                </a>
              )}
            </div>
            <div className={styles.imageUploader}>
              <ImageWall
                files={imageFiles}
                onChange={handleImagesChange}
                onClear={handleClearImages}
              />
            </div>
          </div>

          <label className={styles.contentLabel}>添加标题</label>
          <div className={styles.titleInput}>
            <input
              type="text"
              placeholder="请输入标题，最多20个字"
              maxLength={20}
              value={title}
              onChange={handleTitleChange}
            />
            <span className={styles.titleCount}>{title.length}/20</span>

            {/* 标题的表情按钮 */}
            {typeof window !== 'undefined' && (
              <div className={styles.titleEmojiButton}>
                <Popover
                  content={titleEmojiContent}
                  trigger="click"
                  placement="bottomRight"
                  overlayClassName={styles.emojiPopover}>
                  <button>
                    <SmileOutlined />
                  </button>
                </Popover>
              </div>
            )}
          </div>

          <label className={styles.contentLabel}>添加正文</label>
          <div className={styles.contentTextareaWrapper}>
            <textarea
              ref={contentInputRef}
              className={styles.contentTextarea}
              placeholder="请输入正文内容，最多1000个字"
              maxLength={1000}
              value={content}
              onChange={handleContentChange}
            />
            <span className={styles.contentCount}>{textLength}/1000</span>

            {/* 正文的表情按钮 */}
            {typeof window !== 'undefined' && (
              <div className={styles.contentEmojiButton}>
                <Popover
                  content={contentEmojiContent}
                  trigger="click"
                  placement="topRight"
                  overlayClassName={styles.emojiPopover}>
                  <button>
                    <SmileOutlined />
                  </button>
                </Popover>
              </div>
            )}
          </div>

          <div className={styles.actionButtons}>
            <button
              className={styles.publishButton}
              onClick={handlePublish}
              disabled={imageFiles.length === 0 || !title || !content}>
              发布
            </button>
            <button className={styles.draftButton} onClick={handleSaveDraft}>
              保存草稿
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PublishPage 