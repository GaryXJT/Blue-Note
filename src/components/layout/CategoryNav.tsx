import React, { useState } from 'react'
import styles from './CategoryNav.module.scss'

const categories = [
  { id: 'recommend', name: '推荐' },
  { id: 'fashion', name: '穿搭' },
  { id: 'beauty', name: '美食' },
  { id: 'makeup', name: '彩妆' },
  { id: 'video', name: '影视' },
  { id: 'career', name: '职场' },
  { id: 'emotion', name: '情感' },
  { id: 'home', name: '家居' },
  { id: 'game', name: '游戏' },
  { id: 'travel', name: '旅行' },
  { id: 'health', name: '健康' },
]

const CategoryNav: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('recommend')

  return (
    <nav className={styles.categoryNav}>
      <div className={styles.container}>
        <ul className={styles.list}>
          {categories.map((category) => (
            <li
              key={category.id}
              className={`${styles.item} ${
                activeCategory === category.id ? styles.active : ''
              }`}
              onClick={() => setActiveCategory(category.id)}>
              {category.name}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}

export default CategoryNav
