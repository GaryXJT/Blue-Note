import React, { useState, useRef, useEffect } from 'react'
import { message, Popover, Upload, Button } from 'antd'
import { LeftOutlined, SmileOutlined, UploadOutlined } from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd'
import styles from './PublishVideoPage.module.scss'

// 常用表情列表
const emojiList = [
  '😀',
  '😃',
  '😄',
  '😁',
  '😆',
  '😅',
  '🤣',
  '😂',
  '🙂',
  '🙃',
  '😉',
  '😊',
  '😇',
  '🥰',
  '😍',
  '🤩',
  '😘',
  '😗',
  '😚',
  '😙',
  '😋',
  '😛',
  '😜',
  '🤪',
  '😝',
  '🤑',
  '🤗',
  '🤭',
  '🤫',
  '🤔',
  '🤐',
  '🤨',
  '😐',
  '😑',
  '😶',
  '😏',
  '😒',
  '🙄',
  '😬',
  '🤥',
  '😌',
  '😔',
  '😪',
  '🤤',
  '😴',
  '😷',
  '🤒',
  '🤕',
  '🤢',
  '🤮',
]

interface PublishVideoPageProps {
  initialVideo?: File
  onBack: () => void
  onPublish?: () => void
}

const PublishVideoPage: React.FC<PublishVideoPageProps> = ({
  initialVideo,
  onBack,
  onPublish,
}) => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [textLength, setTextLength] = useState(0)
  const contentInputRef = useRef<HTMLTextAreaElement>(null)

  // 初始化视频状态
  const [videoFile, setVideoFile] = useState<UploadFile>(() => {
    if (initialVideo) {
      return {
        uid: '-1',
        name: initialVideo.name,
        status: 'uploading' as const,
        url: URL.createObjectURL(initialVideo),
        originFileObj: initialVideo as any,
        percent: 0,
      }
    }

    return {
      uid: `-${Date.now()}`,
      name: '',
      status: 'removed' as const,
    }
  })

  // 模拟视频上传进度
  useEffect(() => {
    // 只有在有初始视频时才启动模拟上传进度
    if (initialVideo && videoFile.status === 'uploading') {
      const timer = setInterval(() => {
        setVideoFile((prev) => {
          if (prev.status === 'uploading' && (prev.percent || 0) < 100) {
            const newPercent = (prev.percent || 0) + 10

            if (newPercent >= 100) {
              return {
                ...prev,
                status: 'done' as const,
                percent: 100,
              }
            }

            return {
              ...prev,
              percent: newPercent,
            }
          }
          return prev
        })
      }, 500)

      return () => clearInterval(timer)
    }
  }, [initialVideo])

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

  // 处理视频上传变化
  const handleVideoChange: UploadProps['onChange'] = ({ fileList }) => {
    if (fileList && fileList.length > 0) {
      const file = fileList[0]
      // 确保文件对象和URL属性的正确设置
      setVideoFile((prev) => ({
        ...file,
        url:
          file.url ||
          (file.originFileObj
            ? URL.createObjectURL(file.originFileObj)
            : prev.url),
      }))
    }
  }

  // 自定义上传前检查
  const beforeUpload = (file: File) => {
    const isVideo = file.type.startsWith('video/')
    if (!isVideo) {
      message.error('只能上传视频文件！')
      return false
    }

    // 检查视频大小
    const isSizeValid = file.size / 1024 / 1024 < 100 // 小于100MB
    if (!isSizeValid) {
      message.error('视频必须小于100MB！')
      return false
    }

    // 生成唯一ID和对象URL
    const uniqueId = `upload-${Date.now()}`
    const objectUrl = URL.createObjectURL(file)

    // 设置新的视频文件状态为上传中
    setVideoFile({
      uid: uniqueId,
      name: file.name,
      status: 'uploading' as const,
      url: objectUrl,
      originFileObj: file as any,
      percent: 0,
    })

    // 模拟上传进度
    let percent = 0
    const timer = setInterval(() => {
      percent += 10
      if (percent >= 100) {
        clearInterval(timer)
        setVideoFile((prev) => {
          // 确保我们更新的是当前正在上传的文件
          if (prev.uid === uniqueId) {
            return {
              ...prev,
              status: 'done' as const,
              percent: 100,
            }
          }
          return prev
        })
      } else {
        setVideoFile((prev) => {
          // 确保我们更新的是当前正在上传的文件
          if (prev.uid === uniqueId) {
            return {
              ...prev,
              percent,
            }
          }
          return prev
        })
      }
    }, 300)

    // 返回 false 以阻止 antd 的默认上传行为
    return false
  }

  // 视频上传区域
  const renderVideoUploader = () => {
    if (!videoFile || videoFile.status === 'removed') {
      return (
        <div>
          <Upload
            {...videoUploadProps}
            beforeUpload={beforeUpload}
            customRequest={({ file, onSuccess }) => {
              // 自定义上传请求，手动调用beforeUpload函数
              if (file instanceof File) {
                beforeUpload(file)
              }
              // 模拟上传成功回调，实际上我们在beforeUpload中已经处理了状态
              setTimeout(() => {
                onSuccess && onSuccess('ok')
              }, 0)
            }}>
            <Button className={styles.uploadVideoBtn}>
              <div>
                <UploadOutlined style={{ fontSize: '32px' }} />
                <div style={{ marginTop: '16px' }}>点击上传视频</div>
                <div
                  style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                  支持mp4、mov等常见格式，单个视频不超过100MB
                </div>
              </div>
            </Button>
          </Upload>
        </div>
      )
    }

    return (
      <div className={styles.videoContainer}>
        {videoFile.status === 'uploading' && (
          <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressInner}
                style={{ width: `${videoFile.percent || 0}%` }}
              />
            </div>
            <div className={styles.progressText}>
              上传中 {videoFile.percent || 0}%
            </div>
          </div>
        )}

        {videoFile.status === 'done' && videoFile.url && (
          <div className={styles.videoPreview}>
            <video
              src={videoFile.url}
              controls
              className={styles.videoPlayer}
            />
          </div>
        )}
      </div>
    )
  }

  // 视频上传配置
  const videoUploadProps: UploadProps = {
    action: 'https://660d2bd96ddfa2943b33731c.mockapi.io/api/upload',
    fileList: videoFile.status !== 'removed' ? [videoFile] : [],
    onChange: handleVideoChange,
    maxCount: 1, // 限制只能上传一个视频
    accept: 'video/*', // 只接受视频文件
    showUploadList: false, // 不显示上传列表，使用自定义UI
  }

  // 处理发布
  const handlePublish = () => {
    if (videoFile.status !== 'done') {
      message.error('请等待视频上传完成')
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
      video: videoFile,
    })

    message.success('发布成功')

    if (onPublish) {
      onPublish()
    }
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
            <span className={styles.pageTitle}>发布视频</span>
          </div>

          {/* 视频上传区域 */}
          <div className={styles.videoSection}>
            <div className={styles.videoHeader}>
              <span>视频</span>
            </div>
            <div className={styles.videoUploader}>{renderVideoUploader()}</div>
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
              disabled={videoFile.status !== 'done' || !title || !content}>
              发布
            </button>
            <button className={styles.draftButton}>保存草稿</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PublishVideoPage
