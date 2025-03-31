import React, { useEffect } from "react";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import useAuthStore from "@/store/useAuthStore";
import ThemeProvider from "@/components/theme/ThemeProvider";
import "@/styles/globals.scss";

// 定义需要登录才能访问的路由
const protectedRoutes = [
  "/post/drafts",
  "/post/works",
  "/admin",
];
// 定义需要管理员权限的路由
const adminRoutes = ["/admin"];
// 定义不需要登录就可以访问的路由
const publicRoutes = ["/", "/post/publish", "/login", "/register"];

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const user = useAuthStore((state) => state.user);

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

  return (
    <ThemeProvider>
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
