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

interface WaterfallProps {
  posts: Post[];
  loading: boolean;
  onLoadMore: () => void;
  hasMore?: boolean; // 添加是否有更多数据的标志
  selectedCategory?: string; // 添加选中的分类
}

// 给Window添加一个自定义的属性
declare global {
  interface Window {
    __WATERFALL_DEBUG?: boolean;
  }
}

// 调试日志函数
const debugLog = (...args: any[]) => {
  if (typeof window !== "undefined" && window.__WATERFALL_DEBUG) {
    console.log(...args);
  }
};

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
  hasMore, // 默认为true
  selectedCategory = "", // 默认为空字符串
}) => {
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

    // 排序后的帖子副本
    const postsToDistribute = [...postsToLayout].sort((a, b) =>
      a.id.localeCompare(b.id)
    );

    // 新布局和高度数组
    const newLayout: Post[][] = Array.from({ length: columnsCount }, () => []);
    const heights = new Array(columnsCount).fill(0);

    // 首先检查是否所有的帖子都有缓存的高度
    const allHaveCachedHeight = postsToDistribute.every((post) =>
      itemHeights.current.has(post.id)
    );

    postsToDistribute.forEach((post) => {
      if (allHaveCachedHeight) {
        // 获取帖子的缓存高度
        const postHeight = itemHeights.current.get(post.id) || 350 + GAP;

        // 寻找最短的列
        const minHeight = Math.min(...heights);
        const shortestColumn = heights.indexOf(minHeight);

        // 分配到最短的列
        newLayout[shortestColumn].push(post);
        heights[shortestColumn] += postHeight;
      } else {
        // 使用按高度排序的方法，而不是用ID，这样更加均匀地排列
        const columnIndex = heights.indexOf(Math.min(...heights));
        newLayout[columnIndex].push(post);

        // 更新列高度
        let itemHeight = getItemHeight(post);
        heights[columnIndex] += itemHeight;
      }
    });

    // 使用批量更新
    setLayout(newLayout);
    setColumnHeights(heights);
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
    debugLog("Waterfall: 开始筛选帖子，总数:", posts.length);

    // 重置已加载更多的标志
    hasLoadedMoreRef.current = false;

    // 如果选择类别为空或"所有"，显示全部帖子
    if (!selectedCategory || selectedCategory === "所有") {
      setFilteredPosts(posts);
    } else {
      // 否则，筛选包含所选分类标签的帖子
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
  }, [posts, selectedCategory, columns]);

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
      debugLog(`Waterfall: 列数变化 ${columns} -> ${newColumns}`);
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

  // 分配项目到最短的列 - 修改为使用内部函数
  const distributeItems = useCallback(() => {
    if (!filteredPosts.length || columns === 0 || isFiltering) {
      debugLog("Waterfall: 跳过布局分配，条件不满足", {
        postCount: filteredPosts.length,
        columns,
        isFiltering,
      });
      return;
    }

    // 添加日志便于调试
    debugLog("Waterfall: 开始分配布局，帖子数:", filteredPosts.length);

    // 调用内部布局函数
    distributeItemsInternal(filteredPosts, columns);

    debugLog("Waterfall: 布局分配完成");
  }, [filteredPosts, columns, isFiltering]);

  // 处理卡片高度变化
  const handlePostCardHeightChange = (postId: string, height: number) => {
    const prevHeight = itemHeights.current.get(postId);
    // 只有当高度真正变化时才更新和触发重排
    // 增加阈值为10px减少微小高度变化造成的重排
    if (!prevHeight || Math.abs(prevHeight - height) > 10) {
      debugLog(
        `Waterfall: 卡片 ${postId} 高度变化: ${prevHeight} -> ${height}`
      );
      // 保存新的高度
      itemHeights.current.set(postId, height + GAP);
      // 标记需要重新布局，但不立即触发，通过防抖延迟
      if (!isFiltering) {
        if (resizeTimerRef.current) {
          clearTimeout(resizeTimerRef.current);
        }
        resizeTimerRef.current = setTimeout(() => {
          setNeedsReflow(true);
        }, 500); // 增加到500ms延迟，减少频繁重排
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

  // 监听窗口大小变化的优化版本
  useEffect(() => {
    calculateColumns(); // 初始计算

    // 使用截流函数处理调整大小事件
    let resizeTimeout: NodeJS.Timeout | null = null;
    let lastResizeTime = 0;
    const RESIZE_THROTTLE = 200; // 200ms截流

    const handleResize = () => {
      const now = Date.now();

      // 清除之前的定时器
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
        resizeTimeout = null;
      }

      // 如果距离上次resize时间不足阈值，延迟处理
      if (now - lastResizeTime < RESIZE_THROTTLE) {
        resizeTimeout = setTimeout(() => {
          lastResizeTime = Date.now();
          calculateColumns();
        }, RESIZE_THROTTLE);
      } else {
        // 否则立即处理
        lastResizeTime = now;
        calculateColumns();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
    };
  }, [calculateColumns]);

  // 当列数或筛选后的帖子变化时，重新计算布局
  useEffect(() => {
    if (isFiltering) {
      debugLog("Waterfall: 正在筛选，跳过布局计算");
      return; // 如果正在筛选中，不重新计算布局
    }

    if (filteredPosts.length === 0) {
      debugLog("Waterfall: 没有帖子，跳过布局计算");
      return; // 没有帖子不需要计算布局
    }

    // 如果不是首次渲染，则使用正常的布局更新流程
    if (!isFirstRenderRef.current) {
      debugLog("Waterfall: 触发布局计算 - 列数或帖子变化");

      // 使用requestAnimationFrame确保在下一帧渲染前计算完成
      requestAnimationFrame(() => {
        distributeItems();
      });
    }
  }, [columns, filteredPosts, distributeItems, isFiltering]);

  // 当高度变化需要重新布局时
  useEffect(() => {
    if (needsReflow && !isFiltering && filteredPosts.length > 0) {
      debugLog("Waterfall: 高度变化，需要重排");

      // 使用更长的防抖延迟，减少频繁重排
      const timer = setTimeout(() => {
        distributeItems();
        setNeedsReflow(false);
      }, 500); // 增加延迟到500ms，减少抽搐

      return () => clearTimeout(timer);
    }
  }, [needsReflow, isFiltering, distributeItems, filteredPosts.length]);

  // 设置无限滚动
  useEffect(() => {
    // 清除之前的观察者
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    // 如果没有更多数据或者正在加载，不设置观察者
    if (!loadingRef.current || !hasMore || loading) return;

    // 添加一个标记变量，用于防止初次加载时触发
    let isInitialIntersection = true;
    let throttleTimer: NodeJS.Timeout | null = null;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // 初次加载不触发loadMore，仅标记已观察到
        if (isInitialIntersection) {
          debugLog("Waterfall: 忽略初次交叉触发");
          isInitialIntersection = false;
          return;
        }

        if (entries[0].isIntersecting && !loading && !isFiltering && hasMore) {
          // 使用节流控制，防止频繁触发
          if (!throttleTimer) {
            throttleTimer = setTimeout(() => {
              // 只有在非筛选状态、非加载状态且还有更多数据时才触发加载更多
              // 立即断开观察者连接，避免重复触发
              if (observerRef.current) {
                observerRef.current.disconnect();
              }
              debugLog("Waterfall: 触发加载更多");
              onLoadMore();
              throttleTimer = null;
            }, 300);
          }
        }
      },
      {
        threshold: 0.1,
        rootMargin: "300px 0px", // 提前300px触发加载
      }
    );

    observerRef.current.observe(loadingRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (throttleTimer) {
        clearTimeout(throttleTimer);
      }
    };
    // 只在这些值变化时重新设置观察者，避免不必要的重置
  }, [loading, hasMore, isFiltering, onLoadMore]);

  // 当hasMore变化时，重置加载状态
  useEffect(() => {
    if (!hasMore) {
      hasLoadedMoreRef.current = true; // 如果没有更多数据，标记为已经加载过
    }
  }, [hasMore]);

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
    debugLog("Waterfall: 重置所有缓存");
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
        {loading && !isFiltering && hasMore && (
          <>
            <div className={styles.spinner} />
            <span>加载中...</span>
          </>
        )}
      </div>
    </div>
  );
};

export default Waterfall;
