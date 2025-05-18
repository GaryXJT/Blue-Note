import React, { useEffect, useState } from "react";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import useAuthStore from "@/store/useAuthStore";
import ThemeProvider from "@/components/theme/ThemeProvider";
import "@/styles/globals.scss";
import config from "@/config";

// 定义需要登录才能访问的路由
const protectedRoutes = ["/post/drafts", "/post/works", "/admin"];
// 定义需要管理员权限的路由
const adminRoutes = ["/admin"];
// 定义不需要登录就可以访问的路由
const publicRoutes = ["/", "/post/publish", "/login", "/register"];

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const user = useAuthStore((state) => state.user);
  // 添加状态跟踪zustand是否已完成从localStorage加载
  const [isHydrated, setIsHydrated] = useState(false);

  // 确保Zustand状态已从localStorage恢复
  useEffect(() => {
    // 当组件挂载时，设置hydrated为true
    setIsHydrated(true);

    // 检查localStorage中的token和当前zustand状态
    const storedToken = localStorage.getItem(config.cache.tokenKey);

    // 如果localStorage有token但zustand没有登录状态，尝试恢复登录状态
    if (storedToken && !isLoggedIn) {
      console.log("发现localStorage中有token但zustand未登录，正在恢复登录状态");
      // 这里仅做日志记录，不进行手动恢复，因为zustand的persist中间件应该会自动处理
    }

    console.log("App初始化 - 用户登录状态:", isLoggedIn, "用户信息:", user);
  }, [isLoggedIn, user]);

  useEffect(() => {
    // 路由权限检查
    const pathIsProtected = protectedRoutes.some((route) =>
      router.pathname.startsWith(route)
    );
    const pathIsAdminOnly = adminRoutes.some((route) =>
      router.pathname.startsWith(route)
    );

    if (pathIsProtected && !isLoggedIn) {
      // 如果是受保护的路由但用户未登录，重定向到首页
      router.replace("/");
      return;
    }

    if (pathIsAdminOnly && user?.role !== "admin") {
      // 如果是管理员路由但用户不是管理员，重定向到首页
      router.replace("/");
      return;
    }
  }, [router, isLoggedIn, user]);

  useEffect(() => {
    const handleUserLoggedOut = () => {
      // 更新 Zustand store
      useAuthStore.getState().logout();
    };

    window.addEventListener("userLoggedOut", handleUserLoggedOut);
    return () => {
      window.removeEventListener("userLoggedOut", handleUserLoggedOut);
    };
  }, []);

  // 在hydrate完成前显示加载状态或什么都不显示
  if (!isHydrated) {
    return null; // 或者可以返回一个加载指示器
  }

  return (
    <ThemeProvider>
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
