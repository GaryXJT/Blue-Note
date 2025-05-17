import React, { useState, useRef, useEffect } from "react";
import styles from "./CategoryNav.module.scss";

const categories = [
  { id: "all", name: "所有" },
  { id: "fashion", name: "穿搭" },
  { id: "beauty", name: "美食" },
  { id: "makeup", name: "彩妆" },
  { id: "video", name: "影视" },
  { id: "career", name: "职场" },
  { id: "emotion", name: "情感" },
  { id: "home", name: "家居" },
  { id: "game", name: "游戏" },
  { id: "travel", name: "旅行" },
  { id: "health", name: "健康" },
  { id: "other", name: "其他" },
];

interface CategoryNavProps {
  onCategoryChange?: (category: string) => void;
  selectedCategory?: string;
}

const CategoryNav: React.FC<CategoryNavProps> = ({
  onCategoryChange,
  selectedCategory: externalSelectedCategory,
}) => {
  const [internalActiveCategory, setInternalActiveCategory] = useState("所有");

  const activeCategory = externalSelectedCategory || internalActiveCategory;

  const navRef = useRef<HTMLUListElement>(null);
  const [floatingEllipseStyle, setFloatingEllipseStyle] = useState({
    width: 0,
    height: 0,
    left: 0,
    top: 0,
    opacity: 0,
  });

  const handleCategoryClick = (categoryName: string) => {
    // 更新当前活动分类
    setInternalActiveCategory(categoryName);

    // 调用回调函数，通知父组件分类变化
    // 当用户点击分类时，将触发API请求，传递dataClass参数
    if (onCategoryChange) {
      onCategoryChange(categoryName);
    }
  };

  const handleCategoryMouseEnter = (
    categoryId: string,
    event: React.MouseEvent<HTMLLIElement>
  ) => {
    updateEllipsePosition(event.currentTarget);
  };

  const handleCategoryMouseLeave = () => {
    // 当鼠标离开时，找到当前激活的元素并更新椭圆位置
    if (navRef.current) {
      const activeElement = navRef.current.querySelector(
        `.${styles.active}`
      ) as HTMLElement;
      if (activeElement) {
        updateEllipsePosition(activeElement);
      }
    }
  };

  // 更新浮动椭圆的位置和大小
  const updateEllipsePosition = (element: HTMLElement) => {
    const { width, height } = element.getBoundingClientRect();

    // 计算相对于导航容器的位置
    const navRect = navRef.current?.getBoundingClientRect();
    if (!navRect) return;

    const elemRect = element.getBoundingClientRect();
    const left = elemRect.left - navRect.left;

    setFloatingEllipseStyle({
      width,
      height,
      left,
      top: (navRect.height - height) / 2,
      opacity: 1,
    });
  };

  // 初始化浮动椭圆位置
  useEffect(() => {
    // 组件挂载后和activeCategory变化时更新椭圆位置
    if (navRef.current) {
      const activeElement = navRef.current.querySelector(
        `.${styles.active}`
      ) as HTMLElement;
      if (activeElement) {
        // 添加一点延迟确保DOM已完全渲染
        setTimeout(() => {
          updateEllipsePosition(activeElement);
        }, 100);
      }
    }
  }, [activeCategory]);

  return (
    <nav className={styles.categoryNav}>
      <div className={styles.container}>
        <ul className={styles.list} ref={navRef}>
          {/* 浮动椭圆背景 */}
          <div
            className={styles.floatingEllipse}
            style={{
              width: `${floatingEllipseStyle.width}px`,
              height: `${floatingEllipseStyle.height}px`,
              left: `${floatingEllipseStyle.left}px`,
              top: `${floatingEllipseStyle.top}px`,
              opacity: floatingEllipseStyle.opacity,
            }}
          />

          {categories.map((category) => (
            <li
              key={category.id}
              className={`${styles.item} ${
                activeCategory === category.name ? styles.active : ""
              }`}
              onClick={() => handleCategoryClick(category.name)}
              onMouseEnter={(e) => handleCategoryMouseEnter(category.id, e)}
              onMouseLeave={handleCategoryMouseLeave}
            >
              {category.name}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default CategoryNav;
