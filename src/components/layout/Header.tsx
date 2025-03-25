import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { Dropdown, Avatar, Menu, message } from 'antd'
import { DownOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons'
import styles from './Header.module.scss'
import LoginModal from '../auth/LoginModal'
import useAuthStore from '@/store/useAuthStore'

const Header: React.FC = () => {
  const router = useRouter()
  const { isAuthenticated, currentUser, logout } = useAuthStore()
  const [loginModalVisible, setLoginModalVisible] = useState(false)
  
  const handleLogout = () => {
    logout()
    message.success('退出登录成功')
    
    // 如果当前页面需要登录权限，则重定向到首页
    if (router.pathname.includes('/profile') || router.pathname.includes('/admin')) {
      router.push('/')
    }
  }
  
  const userMenu = (
    <Menu>
      <Menu.Item key="profile" onClick={() => router.push('/profile')}>
        个人主页
      </Menu.Item>
      <Menu.Item key="settings" onClick={() => router.push('/profile/settings')}>
        设置
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" onClick={handleLogout}>
        退出登录
      </Menu.Item>
    </Menu>
  )
  
  return (
    <header className={styles.header}>
      <div className={styles.content}>
        <Link href="/" className={styles.logo}>
          <Image src="/logo.svg" alt="Blue Note" width={120} height={30} />
        </Link>
        
        <div className={styles.search}>
          <input
            type="text"
            placeholder="搜索内容..."
            className={styles.searchInput}
          />
          <button className={styles.searchButton}>
            <SearchOutlined />
          </button>
        </div>
        
        <div className={styles.userArea}>
          {isAuthenticated && currentUser ? (
            <Dropdown overlay={userMenu} trigger={['click']}>
              <div className={styles.userInfo}>
                <Avatar 
                  className={styles.avatar}
                  src={currentUser.avatar} 
                  icon={<UserOutlined />} 
                  size={32} 
                />
                <span className={styles.username}>{currentUser.username}</span>
                <DownOutlined className={styles.arrowIcon} />
              </div>
            </Dropdown>
          ) : (
            <button 
              className={styles.loginButton}
              onClick={() => setLoginModalVisible(true)}
            >
              登录
            </button>
          )}
        </div>
      </div>
      
      <LoginModal 
        visible={loginModalVisible} 
        onCancel={() => setLoginModalVisible(false)} 
      />
    </header>
  )
}

export default Header
