import React, { useState, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { Button, Upload, message } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import styles from './VideoUpload.module.scss'
import type { UploadProps } from 'antd'
import PublishVideoPage from '../../components/publish/PublishVideoPage'

const VideoUploadPage: React.FC = () => {
  const router = useRouter()
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 处理文件选择变化
  const handleFileChange = (info: any) => {
    const file = info.file.originFileObj
    if (file) {
      // 检查文件类型
      if (!file.type.startsWith('video/')) {
        message.error('请上传视频文件')
        return
      }

      // 检查文件大小（100MB = 100 * 1024 * 1024 字节）
      if (file.size > 100 * 1024 * 1024) {
        message.error('视频文件不能超过100MB')
        return
      }

      setSelectedVideo(file)
    }
  }

  // 处理返回操作
  const handleBack = () => {
    setSelectedVideo(null)
  }

  // 处理发布完成后的操作
  const handlePublishDone = () => {
    router.push('/post/works')
  }

  // 视频上传的配置
  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: 'video/*',
    showUploadList: false,
    customRequest: ({ file }: any) => {
      handleFileChange({ file: { originFileObj: file } })
    },
    onChange: handleFileChange,
  }

  // 如果已经选择了视频，显示发布视频页面
  if (selectedVideo) {
    return (
      <PublishVideoPage
        initialVideo={selectedVideo}
        onBack={handleBack}
        onPublish={handlePublishDone}
      />
    )
  }

  // 否则显示视频上传页面
  return (
    <>
      <Head>
        <title>上传视频 - 小蓝书</title>
      </Head>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>上传视频</h1>
        </div>
        <div className={styles.content}>
          <div
            className={styles.uploadArea}
            onClick={() => fileInputRef.current?.click()}>
            <div className={styles.uploadIcon}>
              <UploadOutlined />
            </div>
            <div className={styles.uploadText}>
              <p>点击或拖拽上传视频</p>
              <p className={styles.uploadHint}>
                支持mp4、mov等常见格式，单个视频不超过100MB
              </p>
            </div>
            <Upload {...uploadProps}>
              <Button
                type="primary"
                icon={<UploadOutlined />}
                className={styles.uploadButton}>
                选择视频
              </Button>
            </Upload>
          </div>
        </div>
      </div>
    </>
  )
}

export default VideoUploadPage
