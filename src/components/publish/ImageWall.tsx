import React from 'react'
import { Upload, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd'
import styles from './ImageWall.module.scss'

interface ImageWallProps {
  files: UploadFile[]
  onChange: (files: UploadFile[]) => void
  onClear: () => void
}

const ImageWall: React.FC<ImageWallProps> = ({ files, onChange, onClear }) => {
  // 处理图片上传
  const handleUpload: UploadProps['onChange'] = ({ fileList }) => {
    // 检查文件类型
    const newFiles = fileList.filter((file) => {
      // 添加类型检查，确保file.type存在
      const isImage = file.type && file.type.startsWith('image/')
      if (!isImage) {
        message.error('只能上传图片文件！')
        return false
      }
      return true
    })

    // 检查文件大小（限制为5MB）
    const validFiles = newFiles.filter((file) => {
      // 添加文件大小检查，确保file.size存在
      const isLt5M = file.size ? file.size / 1024 / 1024 < 5 : true
      if (!isLt5M) {
        message.error('图片大小不能超过5MB！')
        return false
      }
      return true
    })

    onChange(validFiles)
  }

  // 处理图片删除
  const handleRemove = (file: UploadFile) => {
    const newFiles = files.filter((f) => f.uid !== file.uid)
    onChange(newFiles)
  }

  // 上传配置
  const uploadProps: UploadProps = {
    accept: 'image/*',
    listType: 'picture-card',
    fileList: files,
    onChange: handleUpload,
    onRemove: handleRemove,
    maxCount: 9,
    multiple: true,
    beforeUpload: (file) => {
      // 在这里拦截文件上传，直接返回false表示不上传到服务器
      return false
    }
  }

  return (
    <div className={styles.imageWall}>
      <Upload {...uploadProps}>
        <div>
          <PlusOutlined />
          <div style={{ marginTop: 8 }}>上传</div>
        </div>
      </Upload>
    </div>
  )
}

export default ImageWall 