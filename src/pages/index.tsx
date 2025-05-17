import React, { useState, useEffect, useCallback, useRef } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Header from "@/components/layout/Header";
import CategoryNav from "@/components/layout/CategoryNav";
import Waterfall from "@/components/layout/Waterfall";
import Sidebar from "@/components/layout/Sidebar";
import ProfileContent from "@/components/profile/ProfileContent";
import styles from "@/styles/Home.module.scss";
import useAuthStore from "@/store/useAuthStore";
import { getCursorPosts } from "@/api/services/posts";
import { message } from "antd";

// 扩展window类型，添加_lastLoadingKey属性
declare global {
  interface Window {
    _lastLoadingKey?: string;
  }
}

const Home: React.FC = () => {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [key, setKey] = useState(0); // 用于强制重新渲染瀑布流组件
  const [showProfile, setShowProfile] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(""); // 添加选中的分类状态
  const [searchText, setSearchText] = useState("");
  const [searchType, setSearchType] = useState("post");
  const [selectedType, setSelectedType] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [hasInitialized, setHasInitialized] = useState(false); // 添加初始化标记

  // 添加一个引用来跟踪初始加载是否已完成
  const isInitialLoadRef = useRef(false);

  // 使用ref来保存上一次的标签页值
  const prevTabRef = useRef<string>("");

  // 处理个人资料标签页变化
  const [activeProfileTab, setActiveProfileTab] = useState("posts");

  // 从zustand获取登录状态
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const user = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.hydrated);

  // 添加useEffect监控zustand的状态变化
  useEffect(() => {
    console.log("Auth状态变化:", {
      isLoggedIn,
      userId: user?.userId,
      isHydrated,
      hasInitialized,
    });
  }, [isLoggedIn, user, isHydrated, hasInitialized]);

  // 格式化帖子数据以匹配组件期望的格式
  const formatPost = (post: any) => {
    return {
      id: post.id || post.postId,
      title: post.title,
      content: post.content,
      type: post.type,
      tags: post.tags || [],
      files: post.files || [],
      coverUrl: post.coverImage,
      width: post.width || 800, // 默认宽度
      height: post.height || 600, // 默认高度
      author: {
        id: post.userId,
        name: post.nickname || post.username || "用户",
        avatar: post.avatar || "https://via.placeholder.com/80",
      },
      createdAt: post.createdAt,
      updatedAt: post.updatedAt || post.createdAt,
      likes: post.likes || post.likeCount || 0,
      comments: post.comments || post.commentCount || 0,
      userId: post.userId,
      username: post.username,
      nickname: post.nickname,
      likedByUser: post.likedByUser,
      followedByUser: post.followedByUser,
    };
  };

  // 加载更多数据 - 使用useCallback包装以避免不必要的重新创建
  const loadPosts = useCallback(
    async (cursor?: string, isReset: boolean = false, tabKey?: string) => {
      console.log("👉 loadPosts直接被调用:", { cursor, isReset, tabKey });

      // 如果正在加载中且不是重置操作，直接返回
      if (loading && !isReset) {
        console.log("已经在加载中，跳过请求");
        return;
      }

      // 如果已经没有更多数据且不是重置操作，直接返回
      if (!hasMore && !isReset && !cursor) {
        console.log("没有更多数据，跳过请求");
        return;
      }

      // 添加标志防止重复调用
      const loadingKey = `${tabKey || activeProfileTab}-${cursor}-${isReset}`;
      if (window._lastLoadingKey === loadingKey && !isReset) {
        console.log("跳过重复加载:", loadingKey);
        return;
      }
      window._lastLoadingKey = loadingKey;

      // 优先使用传入的tabKey参数，否则使用组件状态中的值
      const currentTab = tabKey || activeProfileTab;

      // 添加调试日志
      console.log("⭐ 开始加载数据:", {
        cursor,
        isReset,
        tabKey, // 新增：显示传入的标签页参数
        hasMore,
        nextCursor,
        isInitialLoad: !isInitialLoadRef.current,
        isLoggedIn,
        userId: user?.userId,
        isHydrated,
        currentTab,
        loadingKey,
      });

      // 标记初始加载已完成(对于非重置操作)
      if (!isReset && !isInitialLoadRef.current) {
        isInitialLoadRef.current = true;
      }

      // 如果是重置操作，确保首先清空当前数据
      if (isReset && showProfile) {
        console.log(`强制重置数据状态，切换到 ${currentTab} 标签页`);
        setPosts([]);
        setNextCursor(undefined);
      }

      // 如果zustand状态还未加载完成且用户未登录，等待加载
      if (!isHydrated && isLoggedIn === false) {
        console.log("zustand状态未完全加载，延迟执行");
        // 等待一小段时间后重试
        setTimeout(() => loadPosts(cursor, isReset, currentTab), 200);
        return;
      }

      // 设置加载状态
      setLoading(true);

      try {
        console.log("🔍 准备发起API请求");

        // 获取当前查看的用户ID (如果在个人资料页)
        const profileUserId = router.query.profile as string;

        // 检查localStorage中的token，确保登录状态一致
        const storedToken = localStorage.getItem("token");
        const storeState = useAuthStore.getState();

        // 额外的安全检查 - 确保zustand状态与localStorage一致
        const actualIsLoggedIn = storedToken && storeState.isLoggedIn;
        const actualUserId = storeState.user?.userId;

        // 构建API请求参数
        const apiParams: any = {
          cursor: isReset ? undefined : cursor || nextCursor,
          limit: 2, // 增加每页加载数量，减少加载频率
          search: searchText,
          searchType: searchType === "post" ? "content" : "author",
          type: selectedType as "video" | "image" | undefined,
          tag: selectedTag,
        };

        // 使用实际的登录状态和用户ID
        if (actualIsLoggedIn && actualUserId) {
          apiParams.currentUserId = actualUserId;
          console.log("添加用户ID到请求:", actualUserId);
        } else if (isLoggedIn && user?.userId) {
          // 回退到组件状态
          apiParams.currentUserId = user.userId;
          console.log("回退到组件用户ID:", user.userId);
        }

        // 如果在个人资料页，添加筛选参数
        if (showProfile && profileUserId) {
          apiParams.filterUser = profileUserId;

          // 使用当前的标签页状态设置筛选类型
          if (currentTab === "posts") {
            apiParams.filterType = "onlyCurrentUser";
            console.log("应用筛选: 用户自己的帖子");
          } else if (currentTab === "likes") {
            apiParams.filterType = "like";
            console.log("应用筛选: 用户点赞的帖子");
          } else if (currentTab === "follows") {
            apiParams.filterType = "follow";
            console.log("应用筛选: 关注用户的帖子");
          }
        }

        console.log("🚀 发送API请求，参数:", apiParams);
        const response = await getCursorPosts(apiParams);
        console.log("✅ API响应:", response?.data?.data);

        if (response && response.data && response.data.data) {
          const postsData = response.data.data.posts || [];

          // 如果没有获取到数据，说明没有更多数据了
          if (postsData.length === 0) {
            console.log("⚠️ API返回空数据，设置hasMore=false");
            setHasMore(false);
            setLoading(false);
            return;
          }

          // 处理帖子数据格式
          const formattedPosts = postsData.map(formatPost);

          // 添加到现有帖子列表 - 确保重置操作时清空现有数据
          if (isReset) {
            console.log("重置操作: 使用全新数据替换现有数据");
            setPosts(formattedPosts);
          } else {
            console.log("追加操作: 添加新数据到现有数据");
            setPosts((prev) => [...prev, ...formattedPosts]);
          }

          // 直接使用API返回的hasMore字段
          const apiHasMore = response.data.data.hasMore === true;
          console.log("✅ API返回的hasMore值:", apiHasMore);

          // 更新hasMore状态
          setHasMore(apiHasMore);

          // 设置下一次请求的游标
          if (apiHasMore && response.data.data.nextCursor) {
            console.log("⏭️ 设置下一页游标:", response.data.data.nextCursor);
            setNextCursor(response.data.data.nextCursor);
          } else {
            console.log("没有更多数据或没有提供下一页游标");
            if (!apiHasMore) {
              setNextCursor(undefined);
            }
          }

          // 输出当前获取的数据状态
          console.log("📊 数据加载完成:", {
            total: isReset
              ? formattedPosts.length
              : (prev: any[]) => prev.length + formattedPosts.length,
            newItems: formattedPosts.length,
            hasMore: apiHasMore,
            nextCursor: response.data.data.nextCursor,
          });
        } else {
          // 如果响应异常，也将hasMore设置为false
          console.log("❌ 响应异常，设置hasMore=false");
          setHasMore(false);
        }
      } catch (error) {
        console.error("❌ 获取帖子失败:", error);
        message.error("获取帖子失败，请稍后再试");
        setHasMore(false); // 出错时也设置为没有更多数据
      } finally {
        // 延迟100ms再设置loading=false，避免UI闪烁
        setTimeout(() => {
          setLoading(false);
          console.log("🏁 加载状态结束，可以继续加载更多");
        }, 100);
      }
    },
    [
      loading,
      hasMore,
      nextCursor,
      searchText,
      searchType,
      selectedType,
      selectedTag,
      showProfile,
      activeProfileTab, // 确保将activeProfileTab添加到依赖数组中
      router.query,
      isLoggedIn,
      user,
      isHydrated,
    ]
  );

  // 监听路由变化并处理初始加载
  useEffect(() => {
    // 统一的路由状态检查和处理函数
    const handleProfileRouteState = (path: string) => {
      // 判断是否包含profile查询参数
      const isProfilePage = path.includes("profile=");

      // 只有当当前状态与目标状态不同时才更新
      if (isProfilePage !== showProfile) {
        console.log(
          `路由状态变化: ${isProfilePage ? "进入" : "离开"}个人资料页`
        );

        // 进入个人资料页前先清空帖子数据，避免显示首页数据
        if (isProfilePage) {
          // 立即清空posts数组，防止首页数据在个人资料页显示
          setPosts([]);
          setNextCursor(undefined);
          setHasMore(true);
          setLoading(true);

          // 初始标签页设置为posts
          console.log("设置标签页为posts");
          setActiveProfileTab("posts");
          prevTabRef.current = "posts"; // 防止触发额外请求
          useAuthStore.getState().setLastUsedTab("posts");

          // 使用短延时确保状态已更新
          setTimeout(() => {
            console.log("从首页进入个人资料页，主动触发数据加载");
            loadPosts(undefined, true, "posts");
          }, 100);
        }

        // 更新显示状态（必须在清空数据后更新）
        setShowProfile(isProfilePage);

        // 从个人资料页切换到首页时，重新加载数据
        if (!isProfilePage) {
          // 重置数据状态
          setPosts([]);
          setNextCursor(undefined);
          setHasMore(true);
          prevTabRef.current = "";
          setLoading(true);

          // 确保DOM更新后再重新渲染瀑布流并加载数据
          setTimeout(() => {
            setKey((prev) => prev + 1);
            // 重新加载首页数据
            loadPosts(undefined, true);
          }, 100);
        }
      }
    };

    // 路由变化事件处理函数
    const handleRouteChange = (url: string) => {
      handleProfileRouteState(url);
    };

    // 初始检查 - 只在组件挂载时执行一次
    handleProfileRouteState(router.asPath);

    // 监听后续的路由变化
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router, showProfile, loadPosts]);

  // 初始加载
  useEffect(() => {
    // 使用标记确保只调用一次，防止重复调用
    // 同时确保zustand已经从localStorage中加载完成
    if (
      !hasInitialized &&
      !loading &&
      !isInitialLoadRef.current &&
      isHydrated
    ) {
      const fetchInitialData = async () => {
        // 标记已经初始化
        setHasInitialized(true);

        // 只在没有数据时请求数据
        if (posts.length === 0) {
          console.log("执行初始数据加载 - zustand已hydrated");
          await loadPosts();
        }
      };

      fetchInitialData();
    }
  }, [loadPosts, posts.length, loading, hasInitialized, isHydrated]);

  // 处理分类变化
  const handleCategoryChange = (categoryName: string) => {
    setSelectedCategory(categoryName);
    // 重置数据状态
    setPosts([]);
    setNextCursor(undefined);
    setHasMore(true);
    // 重新加载数据
    loadPosts(undefined, true);
  };

  // 当个人资料标签页变化时，重置帖子数据并重新加载
  useEffect(() => {
    // 如果不在个人资料页，则退出
    if (!showProfile) return;

    // 特殊处理：路由初始加载时，prevTabRef已经在路由处理useEffect中设置为"posts"
    // 如果是路由初始加载的情况，跳过数据加载
    if (prevTabRef.current === "" || prevTabRef.current === "初始化") {
      console.log(`index.tsx: 标签页初始化为 ${activeProfileTab}`);
      prevTabRef.current = activeProfileTab;
      // 跳过初始加载，让ProfileContent组件处理初始数据加载
      return;
    }

    // 检查标签页是否真的改变了，避免死循环
    if (prevTabRef.current === activeProfileTab) {
      console.log(`index.tsx: 标签页未变化，仍为 ${activeProfileTab}`);
      return;
    }

    console.log(
      `index.tsx: 标签页变化 - 从 ${prevTabRef.current} 到 ${activeProfileTab}`
    );

    // 更新ref记录当前标签页
    prevTabRef.current = activeProfileTab;

    // 确保zustand store中的值与当前标签页一致
    console.log(`index.tsx: 检测到标签页更新为 ${activeProfileTab}`);

    // 每次标签页变化都重置数据并重新加载
    // 强制立即清空数据，确保UI立即更新
    setPosts([]);
    setNextCursor(undefined);
    setHasMore(true);
    // 强制设置loading状态，避免显示空数据
    setLoading(true);

    // 立即请求新标签页的数据，不要使用太长的延迟
    console.log(`index.tsx: 立即加载${activeProfileTab}标签页数据`);
    // 使用更短的延时，确保状态更新但不等待太久
    loadPosts(undefined, true, activeProfileTab);
  }, [activeProfileTab, showProfile, loadPosts]);

  // 处理查看个人资料
  const handleViewProfile = () => {
    if (isLoggedIn && user?.userId) {
      // 如果已经在个人资料页，不需要重复操作
      if (router.asPath.includes(`profile=${user.userId}`)) {
        return;
      }

      // 只更改路由，不直接修改state
      // 让路由变化的useEffect处理state变化
      router.push(`/?profile=${user.userId}`, undefined, { shallow: true });
    }
  };

  // 处理返回首页
  const handleBackToHome = () => {
    // 不直接设置showProfile，而是通过更改路由来触发变更
    router.push("/", undefined, { shallow: true });
  };

  // 处理菜单变化
  const handleMenuChange = (menu: string) => {
    if (menu === "publish") {
      router.push("/post/publish");
    }
  };

  return (
    <>
      <Head>
        <title>小蓝书 - 记录美好生活</title>
        <meta name="description" content="小蓝书 - 发现和分享生活中的美好" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="color-scheme" content="light dark" />
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
            <Sidebar onViewProfile={handleViewProfile} />
            <div className={styles.mainContent}>
              <div className={styles.mainInsideContent}>
                {showProfile ? (
                  <ProfileContent
                    activeProfileTab={activeProfileTab}
                    setActiveProfileTab={setActiveProfileTab}
                    userInfo={{
                      avatar: user?.avatar || "https://via.placeholder.com/80",
                      nickname: user?.nickname || "momo",
                      username: user?.username || "momo",
                      accountId: user?.userId || "xxxxxxxx",
                      followCount: 5,
                      fansCount: 2,
                      likeCount: 123,
                      collectCount: 45,
                      postCount: posts.length,
                    }}
                    userHasNoPosts={posts.length === 0}
                    profilePosts={posts}
                    isLoadingPosts={loading}
                    handleLoadMorePosts={(
                      cursor?: string,
                      isReset?: boolean,
                      tabKey?: string
                    ) => {
                      loadPosts(cursor, isReset, tabKey);
                    }}
                    handleMenuChange={handleMenuChange}
                    onBackToHome={handleBackToHome}
                  />
                ) : (
                  <>
                    <CategoryNav onCategoryChange={handleCategoryChange} />
                    <Waterfall
                      key={key} // 使用key强制组件重新渲染
                      posts={posts}
                      loading={loading}
                      onLoadMore={() => {
                        // 确保每次调用都会执行loadPosts，不再检查isInitialLoadRef
                        console.log("⚡ 首页Waterfall触发loadMore");
                        // 直接调用loadPosts函数加载下一页
                        loadPosts(nextCursor, false);
                      }}
                      hasMore={hasMore}
                      selectedCategory={selectedCategory}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Home;
