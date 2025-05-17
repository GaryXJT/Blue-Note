import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from "react";
import PostCard, { PostCardSkeleton } from "../card/PostCard";
import styles from "./Waterfall.module.scss";
import { Post } from "@/api/types";
import { Skeleton } from "antd";
import { useRouter } from "next/router";

// 添加一个简单的节流函数
function throttle(func: Function, delay: number) {
  let lastCall = 0;
  return function (...args: any[]) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

interface WaterfallProps {
  posts: Post[];
  loading: boolean;
  onLoadMore: () => void;
  hasMore?: boolean; // 添加是否有更多数据的标志
  selectedCategory?: string; // 添加选中的分类
}

// 不同列数下的列宽百分比
const COLUMN_WIDTHS = {
  5: 18, // 5列时每列占18%，考虑间距
  4: 22, // 4列时每列占22%
  3: 31, // 3列时每列占30%
  2: 48, // 2列时每列占45%
  1: 90, // 1列时占90%
};

const GAP = 32; // 列间距

const Waterfall: React.FC<WaterfallProps> = ({
  posts,
  loading,
  onLoadMore,
  hasMore = true, // 默认为true
  selectedCategory = "", // 默认为空字符串
}) => {
  const router = useRouter();
  const isProfilePage = !!router.query.profile; // 判断是否在个人资料页
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(getInitialColumns()); // 使用函数获取初始列数
  const [columnHeights, setColumnHeights] = useState<number[]>(
    new Array(getInitialColumns()).fill(0)
  ); // 初始化为正确的列数
  const [layout, setLayout] = useState<Post[][]>(
    Array.from({ length: getInitialColumns() }, () => [])
  ); // 初始化为正确的列数
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const itemHeights = useRef<Map<string, number>>(new Map());
  const resizeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [initialLoading, setInitialLoading] = useState(posts.length === 0);
  const [needsReflow, setNeedsReflow] = useState(false);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [isFiltering, setIsFiltering] = useState(false); // 新增：标记是否正在筛选
  const hasLoadedMoreRef = useRef<boolean>(false); // 添加一个ref来跟踪是否已经触发了加载更多
  const isFirstRenderRef = useRef(true); // 跟踪是否是首次渲染
  const prevPostsCountRef = useRef<number>(0);

  // 简化滚动检测和加载逻辑
  // 移除所有复杂的检测，使用最简单直接的方式
  useEffect(() => {
    // 简单直接的滚动检测函数
    const handleScroll = () => {
      // 如果正在加载或没有更多数据，直接返回
      if (loading || !hasMore) {
        return;
      }

      // 计算滚动位置
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // 获取瀑布流容器位置信息
      const containerRect = containerRef.current?.getBoundingClientRect();
      const containerBottom = containerRect ? containerRect.bottom : 0;

      // 检测是否在个人资料页
      const isInProfilePage =
        router.query.profile || router.pathname.includes("/profile");

      // 根据是否在个人资料页使用不同的触发条件
      let shouldTriggerLoad = false;

      if (isInProfilePage) {
        // 在个人资料页面，当瀑布流底部进入可视区域且距离视窗底部不到300px时触发
        shouldTriggerLoad =
          containerBottom > 0 && containerBottom - windowHeight < 300;
      } else {
        // 在首页或其他页面，使用原来的逻辑
        shouldTriggerLoad = documentHeight - scrollTop - windowHeight < 500;
      }

      if (shouldTriggerLoad) {
        console.log("滚动接近底部，触发加载", {
          scrollTop,
          windowHeight,
          documentHeight,
          containerBottom,
          distance: documentHeight - scrollTop - windowHeight,
          isProfilePage: isInProfilePage,
        });

        // 直接调用onLoadMore
        onLoadMore();
      }
    };

    // 添加滚动事件监听器
    window.addEventListener("scroll", handleScroll);

    // 组件挂载时检查一次
    setTimeout(handleScroll, 500);

    // 清理函数
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [loading, hasMore, onLoadMore, router.query.profile, router.pathname]);

  // 当posts变化时，也检查一次是否需要加载更多
  useEffect(() => {
    // 如果内容高度不够填满页面，主动加载更多
    if (!loading && hasMore && posts.length > 0) {
      const documentHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;

      if (documentHeight <= windowHeight) {
        console.log("内容不足填满页面，主动加载更多", {
          documentHeight,
          windowHeight,
          posts: posts.length,
        });

        // 直接调用onLoadMore
        setTimeout(() => {
          onLoadMore();
        }, 300);
      }
    }
  }, [posts, loading, hasMore, onLoadMore]);

  // 获取初始列数的函数
  function getInitialColumns() {
    if (typeof window === "undefined") return 5; // 默认值

    const windowWidth = window.innerWidth;
    if (windowWidth >= 1424) return 5;
    if (windowWidth >= 1192) return 4;
    if (windowWidth >= 696) return 3;
    return 2;
  }

  // 使用useLayoutEffect进行布局计算，确保在浏览器绘制前完成
  useLayoutEffect(() => {
    // 初始化时立即计算列数
    calculateColumns();

    // 如果有帖子数据，立即进行初始布局
    if (posts.length > 0 && isFirstRenderRef.current) {
      setFilteredPosts(posts);
      isFirstRenderRef.current = false;

      // 在初始渲染时立即分配布局，不使用setTimeout
      requestAnimationFrame(() => {
        distributeItemsInternal(posts, columns);
      });
    }
  }, [posts]); // 仅在posts变化时执行

  // 提取一个内部布局分配函数，可以直接接收posts和columns参数
  const distributeItemsInternal = (
    postsToLayout: Post[],
    columnsCount: number
  ) => {
    if (!postsToLayout.length || columnsCount === 0) {
      return;
    }

    console.log("Waterfall: 执行初始布局分配");

    // 新布局和高度数组
    const newLayout: Post[][] = Array.from({ length: columnsCount }, () => []);
    const heights = new Array(columnsCount).fill(0);

    // 对帖子进行排序，保证一致的初始布局
    const postsToDistribute = [...postsToLayout].sort((a, b) =>
      a.id.localeCompare(b.id)
    );

    // 分配所有帖子
    postsToDistribute.forEach((post) => {
      // 始终寻找最短的列
      const minHeight = Math.min(...heights);
      const shortestColumn = heights.indexOf(minHeight);

      // 分配到最短的列
      newLayout[shortestColumn].push(post);

      // 更新列高度
      const postHeight = itemHeights.current.get(post.id) || 350 + GAP;
      heights[shortestColumn] += postHeight;
    });

    // 使用批量更新
    setLayout(newLayout);
    setColumnHeights(heights);

    console.log("Waterfall: 初始布局分配完成");
  };

  // 筛选帖子
  useEffect(() => {
    // 如果posts为空，直接设置filtered为空，避免不必要的处理
    if (posts.length === 0) {
      setFilteredPosts([]);
      return;
    }

    // 标记开始筛选
    setIsFiltering(true);
    console.log("Waterfall: 开始筛选帖子，总数:", posts.length);

    // 重置已加载更多的标志
    hasLoadedMoreRef.current = false;

    // 如果在个人资料页，不进行分类筛选，直接显示所有帖子
    if (isProfilePage) {
      setFilteredPosts(posts);
    }
    // 首页才根据分类进行筛选
    else if (!selectedCategory || selectedCategory === "所有") {
      setFilteredPosts(posts);
    } else {
      // 筛选包含所选分类标签的帖子
      const filtered = posts.filter(
        (post) => post.tags && post.tags.includes(selectedCategory)
      );
      setFilteredPosts(filtered);
    }

    // 使用较短的延迟，因为我们在后面会使用requestAnimationFrame
    const timer = setTimeout(() => {
      // 重置列高度，准备重新计算
      setColumnHeights(new Array(columns).fill(0));
      setNeedsReflow(true);
      setIsFiltering(false); // 标记筛选完成
    }, 100);

    return () => clearTimeout(timer);
  }, [posts, selectedCategory, columns, isProfilePage]);

  // 计算列数
  const calculateColumns = useCallback(() => {
    const windowWidth = window.innerWidth;
    let newColumns = 5; // 默认值

    // 根据屏幕宽度决定列数
    if (windowWidth >= 1424) {
      newColumns = 5;
    } else if (windowWidth >= 1192) {
      newColumns = 4;
    } else if (windowWidth >= 696) {
      newColumns = 3;
    } else {
      newColumns = 2;
    }

    // 只有当列数真正变化时才更新状态
    if (newColumns !== columns) {
      console.log(`Waterfall: 列数变化 ${columns} -> ${newColumns}`);
      setColumns(newColumns);
    }
  }, [columns]);

  // 获取元素实际高度
  const getItemHeight = (post: Post): number => {
    // 首先检查是否已经有测量过的高度
    const cachedHeight = itemHeights.current.get(post.id);
    if (cachedHeight) {
      return cachedHeight + GAP;
    }

    // 如果没有测量过，检查DOM元素
    const element = itemRefs.current.get(post.id);
    if (element) {
      const height = element.offsetHeight + GAP;
      // 缓存高度
      itemHeights.current.set(post.id, height);
      return height;
    }

    // 如果没有高度信息，返回默认值
    return 350 + GAP; // 默认高度
  };

  // 分配项目到最短的列 - 只追加新内容，避免闪烁
  const distributeItems = useCallback(() => {
    if (!filteredPosts.length || columns === 0 || isFiltering) {
      console.log("Waterfall: 跳过布局分配，条件不满足", {
        postCount: filteredPosts.length,
        columns,
        isFiltering,
      });
      return;
    }

    console.log(
      `Waterfall: 分配新帖子到瀑布流布局(${
        isProfilePage ? "个人资料页" : "首页"
      }), 当前列数:`,
      columns
    );

    // 先确保布局列数与当前列数匹配
    let newLayout: Post[][] = [];

    // 处理布局列数不匹配的情况
    if (layout.length !== columns) {
      console.log(
        `布局列数(${layout.length})与当前列数(${columns})不匹配，调整布局`
      );

      // 保存所有现有帖子
      const existingPosts: Post[] = [];
      layout.forEach((column) => {
        column.forEach((post) => {
          existingPosts.push(post);
        });
      });

      // 创建新的布局数组
      newLayout = Array.from({ length: columns }, () => []);

      // 重新分配所有现有帖子
      const heights = new Array(columns).fill(0);
      existingPosts.forEach((post) => {
        // 找出最短的列
        const minHeight = Math.min(...heights);
        const shortestColumnIndex = heights.indexOf(minHeight);

        // 添加到最短列
        newLayout[shortestColumnIndex].push(post);

        // 更新列高度
        const postHeight = itemHeights.current.get(post.id) || 350 + GAP;
        heights[shortestColumnIndex] += postHeight;
      });

      console.log("现有帖子重新分配完成");
    } else {
      // 如果列数匹配，直接使用现有布局
      newLayout = layout.map((column) => [...column]);
    }

    // 找出现有布局中未包含的新帖子
    const existingPostIds = new Set<string>();
    newLayout.forEach((column) => {
      column.forEach((post) => {
        existingPostIds.add(post.id);
      });
    });

    // 过滤出新帖子
    const newPosts = filteredPosts.filter(
      (post) => !existingPostIds.has(post.id)
    );

    if (newPosts.length === 0) {
      console.log("没有新帖子需要添加");

      // 更新布局和高度（如果有变化）
      if (layout.length !== columns) {
        // 计算新的列高度
        const newHeights = new Array(columns).fill(0);
        newLayout.forEach((column, colIndex) => {
          column.forEach((post) => {
            const postHeight = itemHeights.current.get(post.id) || 350 + GAP;
            newHeights[colIndex] += postHeight;
          });
        });

        // 更新状态
        setLayout(newLayout);
        setColumnHeights(newHeights);
        console.log("布局已更新，列数调整为:", columns);
      }

      return;
    }

    console.log(`发现 ${newPosts.length} 个新帖子需要添加`);

    // 计算当前每列的高度
    const heights = new Array(columns).fill(0);
    newLayout.forEach((column, index) => {
      column.forEach((post) => {
        const postHeight = itemHeights.current.get(post.id) || 350 + GAP;
        heights[index] += postHeight;
      });
    });

    console.log("当前各列高度:", heights);

    // 分配新帖子到最短的列
    newPosts.forEach((post) => {
      // 找出当前最短的列
      const minHeight = Math.min(...heights);
      const shortestColumnIndex = heights.indexOf(minHeight);

      console.log(
        `将帖子 ${post.id} 分配到第 ${
          shortestColumnIndex + 1
        } 列，当前高度: ${minHeight}`
      );

      // 将帖子添加到最短的列
      newLayout[shortestColumnIndex].push(post);

      // 更新列高度
      const postHeight = itemHeights.current.get(post.id) || 350 + GAP;
      heights[shortestColumnIndex] += postHeight;
    });

    // 设置新的布局和高度
    setLayout(newLayout);
    setColumnHeights(heights);

    console.log("Waterfall: 新帖子添加完成", {
      columns,
      heights,
      layoutCounts: newLayout.map((col) => col.length),
    });
  }, [filteredPosts, columns, isFiltering, layout, isProfilePage]);

  // 使用useEffect而不是useLayoutEffect，避免重排导致的闪烁
  useEffect(() => {
    if (filteredPosts.length > 0 && !isFiltering) {
      distributeItems();
    }
  }, [filteredPosts, distributeItems, isFiltering]);

  // 当高度变化需要重新布局时
  useEffect(() => {
    if (needsReflow && !isFiltering && filteredPosts.length > 0) {
      console.log("Waterfall: 高度变化，但不执行全局重排，只更新高度");

      // 只更新高度信息，不重新分配
      const updatedHeights = new Array(columns).fill(0);

      layout.forEach((column, colIndex) => {
        column.forEach((post) => {
          const postHeight = itemHeights.current.get(post.id) || 350 + GAP;
          updatedHeights[colIndex] += postHeight;
        });
      });

      setColumnHeights(updatedHeights);
      setNeedsReflow(false);
    }
  }, [needsReflow, isFiltering, filteredPosts.length, layout, columns]);

  // 列数变化时，重新分配所有内容（这是不可避免的）
  useEffect(() => {
    // 列数变化是少见操作，此时必须重新分配所有内容
    if (filteredPosts.length > 0 && layout.length !== columns) {
      console.log("Waterfall: 列数变化，必须重新分配所有内容");

      // 完全重新分配所有内容
      const newLayout: Post[][] = Array.from({ length: columns }, () => []);
      const heights = new Array(columns).fill(0);

      // 获取所有现有帖子，保持原有顺序
      const allPosts: Post[] = [];
      layout.forEach((column) => {
        column.forEach((post) => {
          allPosts.push(post);
        });
      });

      // 可能有新添加的帖子还未分配
      filteredPosts.forEach((post) => {
        if (!allPosts.some((p) => p.id === post.id)) {
          allPosts.push(post);
        }
      });

      // 按ID排序保证一致性
      allPosts.sort((a, b) => a.id.localeCompare(b.id));

      // 重新分配所有帖子
      allPosts.forEach((post) => {
        const minHeight = Math.min(...heights);
        const shortestColumnIndex = heights.indexOf(minHeight);

        newLayout[shortestColumnIndex].push(post);

        const postHeight = itemHeights.current.get(post.id) || 350 + GAP;
        heights[shortestColumnIndex] += postHeight;
      });

      // 设置新布局
      setLayout(newLayout);
      setColumnHeights(heights);
    }
  }, [columns, filteredPosts, layout]);

  // 监听窗口大小变化
  useEffect(() => {
    calculateColumns(); // 初始计算

    // 使用简单节流处理窗口大小变化
    let resizeTimeout: NodeJS.Timeout | null = null;

    const handleResize = () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }

      resizeTimeout = setTimeout(() => {
        calculateColumns();
        console.log("Waterfall: 窗口大小变化，重新计算列数");
      }, 200);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
    };
  }, [calculateColumns]);

  // 使用记忆化的列宽，避免不必要的计算
  const columnWidth = useMemo(() => {
    return COLUMN_WIDTHS[columns as keyof typeof COLUMN_WIDTHS];
  }, [columns]);

  // 使用CSS变量设置的内联样式，也使用记忆化避免重复创建
  const contentStyle = useMemo(() => {
    return {
      "--columns": columns,
      "--gap": `${GAP}px`,
      "--column-width": `${columnWidth}%`,
    } as React.CSSProperties;
  }, [columns, columnWidth]);

  // 使用CSS类名处理渐变效果
  const contentClassName = useMemo(() => {
    return `${styles.content} ${isFiltering ? styles.filtering : ""} ${
      isFirstRenderRef.current ? styles.initialRender : ""
    }`;
  }, [isFiltering]);

  // 生成骨架屏
  const renderSkeletons = () => {
    // 只在初始加载时显示骨架屏
    if (!initialLoading) return null;

    const skeletons = [];
    for (let i = 0; i < columns * 2; i++) {
      skeletons.push(<PostCardSkeleton key={`skeleton-${i}`} />);
    }
    return skeletons;
  };

  // 没有匹配内容时显示的提示
  const renderEmptyState = () => {
    // 如果正在加载中，不显示空状态
    if (loading) return null;

    // 如果正在筛选中，不显示空状态
    if (isFiltering) return null;

    // 如果没有数据，显示空状态
    if (filteredPosts.length === 0) {
      return (
        <div className={styles.emptyState}>
          {selectedCategory ? (
            <>
              <p>暂无{selectedCategory}相关的内容</p>
              <p>试试其他分类吧</p>
            </>
          ) : (
            <>
              <p>暂无内容</p>
              <p>快来发布第一篇笔记吧</p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  // 判断是否应该显示内容
  const shouldShowContent = layout.length > 0 && !isFiltering;

  // 添加一个ref来保存上一次渲染的布局，避免布局抖动
  const prevLayoutRef = useRef<Post[][]>([]);

  // 使用记忆化获取布局，避免不必要的渲染
  const getLayoutToRender = useCallback(() => {
    // 如果当前有布局并且不在筛选中，使用当前布局
    if (layout.length > 0 && !isFiltering) {
      prevLayoutRef.current = layout;
      return layout;
    }

    // 如果正在筛选且之前有布局，继续使用之前的布局减少闪烁
    if (isFiltering && prevLayoutRef.current.length > 0) {
      return prevLayoutRef.current;
    }

    // 默认返回当前布局
    return layout;
  }, [layout, isFiltering]);

  // 获取实际要渲染的布局
  const layoutToRender = getLayoutToRender();

  // 添加一个预设最小高度
  const getMinWaterfallHeight = useCallback(() => {
    const postCount = filteredPosts.length;

    // 根据帖子数量和列数决定最小高度
    if (postCount === 0) return 400;

    // 简单估算: 每个帖子假设300px高度，除以列数
    const estimatedRows = Math.ceil(postCount / columns);
    return Math.max(400, estimatedRows * 300);
  }, [filteredPosts.length, columns]);

  // 添加一个函数重置所有缓存
  const resetAllCaches = useCallback(() => {
    console.log("Waterfall: 重置所有缓存");
    itemHeights.current.clear();
    itemRefs.current.clear();
    hasLoadedMoreRef.current = false;
    setColumnHeights(new Array(columns).fill(0));
    setNeedsReflow(true);
  }, [columns]);

  // 当posts发生变化时，检查是否需要重置缓存
  useEffect(() => {
    // 如果没有帖子，或者帖子数量小于之前（可能是切换到新的内容），重置所有缓存
    if (
      posts.length === 0 ||
      (prevPostsCountRef.current > 0 &&
        posts.length < prevPostsCountRef.current)
    ) {
      resetAllCaches();
    }

    // 记录当前帖子数量，方便下次比较
    prevPostsCountRef.current = posts.length;
  }, [posts, resetAllCaches]);

  // 组件卸载时清理缓存
  useEffect(() => {
    return () => {
      itemHeights.current.clear();
      itemRefs.current.clear();
    };
  }, []);

  // 处理卡片高度变化
  const handlePostCardHeightChange = (postId: string, height: number) => {
    const prevHeight = itemHeights.current.get(postId);
    // 只有当高度真正变化时才更新和触发重排
    // 增加阈值为10px减少微小高度变化造成的重排
    if (!prevHeight || Math.abs(prevHeight - height) > 10) {
      console.log(
        `Waterfall: 卡片 ${postId} 高度变化: ${prevHeight} -> ${height}`
      );
      // 保存新的高度
      itemHeights.current.set(postId, height + GAP);
      // 标记需要重新布局，立即触发重新布局
      if (!isFiltering) {
        setNeedsReflow(true);
      }
    }
  };

  // 首次加载时显示骨架屏
  useEffect(() => {
    // 增加一个计时器，如果加载时间过长，也显示骨架屏
    let loadingTimer: NodeJS.Timeout | null = null;

    if (loading && posts.length === 0) {
      loadingTimer = setTimeout(() => {
        setInitialLoading(true);
      }, 200);
    } else if (posts.length > 0) {
      // 如果有数据，等待一小段时间再隐藏骨架屏，确保平滑过渡
      setTimeout(() => {
        setInitialLoading(false);
      }, 300);
    } else if (!loading) {
      setInitialLoading(false);
    }

    return () => {
      if (loadingTimer) clearTimeout(loadingTimer);
    };
  }, [posts.length, loading]);

  return (
    <div
      className={styles.waterfall}
      ref={containerRef}
      style={{
        minHeight: `${getMinWaterfallHeight()}px`,
        transition: "min-height 0.5s ease",
      }}
    >
      {initialLoading && loading ? (
        // 只在初始加载且正在加载时显示骨架屏
        <div className={styles.skeletonContent} style={contentStyle}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={`skeleton-column-${colIndex}`} className={styles.column}>
              {Array.from({ length: 2 }).map((_, index) => (
                <PostCardSkeleton key={`skeleton-${colIndex}-${index}`} />
              ))}
            </div>
          ))}
        </div>
      ) : (
        // 实际内容
        <div className={contentClassName} style={contentStyle}>
          {renderEmptyState()}
          {layoutToRender.length > 0 &&
            layoutToRender.map((column, columnIndex) => (
              <div key={`column-${columnIndex}`} className={styles.column}>
                {column.map((post) => (
                  <div
                    key={post.id}
                    ref={(el) => {
                      if (el) {
                        itemRefs.current.set(post.id, el);
                      } else {
                        itemRefs.current.delete(post.id);
                      }
                    }}
                  >
                    <PostCard
                      post={post}
                      onHeightChange={handlePostCardHeightChange}
                    />
                  </div>
                ))}
              </div>
            ))}
        </div>
      )}

      <div ref={loadingRef} className={styles.loading}>
        {(loading || hasMore) && !isFiltering && (
          <>
            <div className={styles.spinner} />
            <span>{loading ? "加载中..." : ""}</span>
          </>
        )}
      </div>
    </div>
  );
};

export default Waterfall;
