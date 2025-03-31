import React, { useEffect } from "react";
import useThemeStore from "@/store/useThemeStore";

interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * 主题提供器组件 - 设置全局主题
 */
const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { mode } = useThemeStore();

  useEffect(() => {
    // 根据当前主题模式设置document的data-theme属性
    document.documentElement.setAttribute("data-theme", mode);

    // 如果是深色模式，还设置一些额外的meta标签（例如移动设备状态栏颜色）
    if (mode === "dark") {
      // 适配移动设备深色模式状态栏
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", "#121212");
    } else {
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", "#ffffff");
    }
  }, [mode]);

  return <>{children}</>;
};

export default ThemeProvider;
