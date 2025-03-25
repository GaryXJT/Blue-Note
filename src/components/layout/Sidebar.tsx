import React from 'react'
import Link from 'next/link'
import {
  CompassOutlined,
  PlusCircleOutlined,
  BellOutlined,
  HeartOutlined,
  SearchOutlined,
  StarOutlined,
  MessageOutlined,
  MenuOutlined,
} from '@ant-design/icons'
import styles from './Sidebar.module.scss'

interface SidebarProps {
  onLogin: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ onLogin }) => {
  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.navItem}>
          <div>
            <CompassOutlined style={{ fontSize: '22px' }} />
            <span>发现</span>
          </div>
        </Link>
        <Link href="/post/publish" className={styles.navItem}>
          <div>
            <PlusCircleOutlined style={{ fontSize: '22px' }} />
            <span>发布</span>
          </div>
        </Link>
        <Link href="/post/notifications" className={styles.navItem}>
          <div>
            <BellOutlined style={{ fontSize: '22px' }} />
            <span>通知</span>
          </div>
        </Link>
      </nav>

      <div className={styles.info}>
        <button className={styles.loginBtn} onClick={onLogin}>
          登录
        </button>
        <ul className={styles.features}>
          <div className={styles.title}>马上登录即可</div>
          <li>
            <HeartOutlined />
            <span>刷到更懂你的优质内容</span>
          </li>
          <li>
            <SearchOutlined />
            <span>搜索更新和热门、探索信息</span>
          </li>
          <li>
            <StarOutlined />
            <span>查看收藏、保留好记忆</span>
          </li>
          <li>
            <MessageOutlined />
            <span>与他人互动抽互动、交流</span>
          </li>
        </ul>
      </div>

      <div className={styles.more}>
        <button className={styles.moreBtn}>
          <div>
            <MenuOutlined style={{ fontSize: '22px' }} />
            <span>更多</span>
          </div>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
