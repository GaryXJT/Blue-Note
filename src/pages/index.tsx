import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Header from "@/components/layout/Header";
import CategoryNav from "@/components/layout/CategoryNav";
import Waterfall from "@/components/layout/Waterfall";
import Sidebar from "@/components/layout/Sidebar";
import ProfileContent from "@/components/profile/ProfileContent";
import styles from "@/styles/Home.module.scss";
import useAuthStore from "@/store/useAuthStore";
import { getPosts } from "@/api/services/posts";
import { message } from "antd";

const Home: React.FC = () => {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [key, setKey] = useState(0); // 用于强制重新渲染瀑布流组件
  const [showProfile, setShowProfile] = useState(false);

  // 从zustand获取登录状态
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const user = useAuthStore((state) => state.user);

  // 监听路由变化
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      // 判断是否包含profile查询参数
      const isProfilePage = url.includes("profile=");

      // 只有当当前状态与目标状态不同时才更新
      if (isProfilePage !== showProfile) {
        setShowProfile(isProfilePage);

        // 只有当从个人资料页切换到首页时，才需要重新渲染瀑布流
        if (!isProfilePage) {
          // 确保DOM更新后再重新渲染瀑布流
          setTimeout(() => {
            setKey((prev) => prev + 1);
          }, 100);
        }
      }
    };

    // 初始检查 - 只在组件挂载时执行一次
    const isProfilePage = router.asPath.includes("profile=");
    if (isProfilePage !== showProfile) {
      setShowProfile(isProfilePage);
    }

    router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router, showProfile]); // 添加showProfile作为依赖项

  // 初始加载
  useEffect(() => {
    loadPosts();
  }, []);

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
    };
  };

  // 加载更多数据
  const loadPosts = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await getPosts({
        cursor: nextCursor,
        limit: 10,
      });

      if (response && response.data && response.data.data) {
        const postsData = response.data.data.list || [];

        if (postsData.length === 0) {
          setHasMore(false);
          return;
        }

        // 处理帖子数据格式
        const formattedPosts = postsData.map(formatPost);

        // 添加到现有帖子列表
        setPosts((prev) => [...prev, ...formattedPosts]);

        // 如果获取的数据少于请求的数量，说明没有更多数据了
        setHasMore(postsData.length >= 10);

        // 设置下一次请求的游标为最后一条帖子的ID
        if (postsData.length > 0) {
          const lastPost = postsData[postsData.length - 1];
          setNextCursor(lastPost.id);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      message.error("获取帖子失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  };

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

  // 处理个人资料标签页变化
  const [activeProfileTab, setActiveProfileTab] = useState("posts");

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
                    handleLoadMorePosts={loadPosts}
                    handleMenuChange={handleMenuChange}
                    onBackToHome={handleBackToHome}
                  />
                ) : (
                  <>
                    <CategoryNav />
                    <Waterfall
                      key={key} // 使用key强制组件重新渲染
                      posts={posts}
                      loading={loading}
                      onLoadMore={loadPosts}
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
