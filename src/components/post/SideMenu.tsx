import React from 'react'
import { Menu } from 'antd'
import {
  HomeOutlined,
  UserOutlined,
  AppstoreOutlined,
  FileOutlined,
  FileAddOutlined,
  BellOutlined,
} from '@ant-design/icons'
import styles from './SideMenu.module.scss'
import { MenuType } from '@/types'
import { useRouter } from 'next/router'

interface SideMenuProps {
  activeMenu: MenuType
  onMenuChange: (menu: MenuType) => void
}

const SideMenu: React.FC<SideMenuProps> = ({ activeMenu, onMenuChange }) => {
  const router = useRouter()
  
  // 菜单项配置
  const menuItems = [
    {
      key: 'works',
      icon: <AppstoreOutlined />,
      label: '笔记管理',
    },
    {
      key: 'drafts',
      icon: <FileOutlined />,
      label: '草稿箱',
    },
    {
      key: 'notifications',
      icon: <BellOutlined />,
      label: '通知中心',
    },
  ]

  const handleMenuClick = (key: MenuType) => {
    onMenuChange(key)
    // 根据菜单类型改变 URL
    switch (key) {
      case 'home':
        router.push('/post/home')
        break
      case 'works':
        router.push('/post/works')
        break
      case 'drafts':
        router.push('/post/drafts')
        break
      case 'publish':
        router.push('/post/publish') // 默认显示图文上传标签页
        break
      case 'notifications':
        router.push('/post/notifications')
        break
    }
  }

  return (
    <div className={styles.sideMenuContainer}>
      <div className={styles.publishButton} onClick={() => handleMenuClick('publish')}>
        <FileAddOutlined />
        <span>发布笔记</span>
      </div>
      <div className={styles.divider} />
      <Menu
        className={styles.menu}
        mode="inline"
        selectedKeys={[activeMenu]}
        onClick={({ key }) => handleMenuClick(key as MenuType)}
        items={menuItems}
      />
    </div>
  )
}

export default SideMenu 