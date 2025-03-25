import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import LoginModal from '@/components/auth/LoginModal'
import Header from '@/components/layout/Header'
import CategoryNav from '@/components/layout/CategoryNav'
import Waterfall from '@/components/layout/Waterfall'
import Sidebar from '@/components/layout/Sidebar'
import styles from '@/styles/Home.module.scss'
import { mockPosts } from '@/data/mockData'
import Link from 'next/link'
import { UserOutlined } from '@ant-design/icons'
import { message } from 'antd'
import { authAPI } from '../api/services'

const Home: React.FC = () => {
  const router = useRouter()
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [key, setKey] = useState(0) // 用于强制重新渲染瀑布流组件

  // 初始加载
  useEffect(() => {
    loadPosts()

    // 监听路由变化，当用户返回到首页时，重新初始化瀑布流
    const handleRouteChange = (url: string) => {
      if (url === '/') {
        // 使用setTimeout确保在DOM更新后再重新渲染
        setTimeout(() => {
          setKey((prev) => prev + 1)
        }, 100)
      }
    }

    router.events.on('routeChangeComplete', handleRouteChange)

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [])

  // 加载更多数据
  const loadPosts = async () => {
    if (loading) return

    setLoading(true)
    try {
      // 模拟网络请求延迟
      await new Promise((resolve) => setTimeout(resolve, 800))

      // 使用模拟数据
      const newPosts = mockPosts.map((post) => ({
        ...post,
        id: `${page}-${post.id}`, // 确保每次加载的ID不重复
      }))

      setPosts((prev) => [...prev, ...newPosts])
      setPage((prev) => prev + 1)
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = () => {
    setIsLoginModalOpen(true)
  }

  const handleLoginSuccess = (token: string, userId: string) => {
    // 保存登录状态到本地存储
    localStorage.setItem('token', token)
    localStorage.setItem('userId', userId)
    
    // 刷新页面或更新状态
    window.location.reload()
  }

  return (
    <>
      <Head>
        <title>小蓝书 - 记录美好生活</title>
        <meta name="description" content="小蓝书 - 发现和分享生活中的美好" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        {/* 添加字体图标 */}
        <link
          rel="stylesheet"
          href="https://at.alicdn.com/t/font_2878668_urj9jk31oa.css"
        />
      </Head>

      <div className={styles.container}>
        <Header />

        <main className={styles.main}>
          <div className={styles.content}>
            <Sidebar onLogin={handleLogin} />
            <div className={styles.mainContent}>
              <div className={styles.mainInsideContent}>
                <CategoryNav />
                <Waterfall
                  key={key} // 使用key强制组件重新渲染
                  posts={posts}
                  loading={loading}
                  onLoadMore={loadPosts}
                />
              </div>
            </div>
          </div>
        </main>
      </div>

      <LoginModal
        visible={isLoginModalOpen}
        onCancel={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  )
}

export default Home
