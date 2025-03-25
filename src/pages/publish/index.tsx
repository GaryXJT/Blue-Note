import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import PublishPage from '@/components/publish/PublishPage'
import PublishMenu from '@/components/publish/PublishMenu'
import styles from './Publish.module.scss'
import { useRouter } from 'next/router'

const Publish: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'video' | 'image'>('video')
  const [isEditing, setIsEditing] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const router = useRouter()

  useEffect(() => {
    // 重定向到新的 /post/publish 路由
    router.replace('/post/publish')
  }, [router])

  // 重定向过程中显示空白页面
  return null
}

export default Publish
