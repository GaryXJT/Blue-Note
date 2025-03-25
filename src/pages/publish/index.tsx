import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

const Publish: React.FC = () => {
  const router = useRouter()

  useEffect(() => {
    // 重定向到新的 /post/publish 路由
    router.replace('/post/publish')
  }, [router])

  // 重定向过程中显示空白页面
  return null
}

export default Publish
