import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Header from "@/components/layout/Header";
import CategoryNav from "@/components/layout/CategoryNav";
import Waterfall from "@/components/layout/Waterfall";
import Sidebar from "@/components/layout/Sidebar";
import ProfileContent from "@/components/profile/ProfileContent";
import styles from "@/styles/Home.module.scss";
import { mockPosts } from "@/data/mockData";
import useAuthStore from "@/store/useAuthStore";

const Home: React.FC = () => {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
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

  // 加载更多数据
  const loadPosts = async () => {
    if (loading) return;

    setLoading(true);
    try {
      // 模拟网络请求延迟
      await new Promise((resolve) => setTimeout(resolve, 800));

      // 使用模拟数据
      const newPosts = mockPosts.map((post) => ({
        ...post,
        id: `${page}-${post.id}`, // 确保每次加载的ID不重复
      }));

      setPosts((prev) => [...prev, ...newPosts]);
      setPage((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
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
