import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import styles from './PostHeader.module.scss'

const PostHeader: React.FC = () => {
  return (
    <header className={styles.header}>
      <div className={styles.content}>
        <Link href="/" className={styles.logo}>
          <Image src="/logo.svg" alt="小蓝书" width={80} height={24} />
          <span className={styles.platformTitle}>创作服务平台</span>
        </Link>
      </div>
    </header>
  )
}

export default PostHeader
