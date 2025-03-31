import { create } from "zustand";
import { persist } from "zustand/middleware";

type ThemeMode = "light" | "dark";

interface ThemeState {
  mode: ThemeMode;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
}

// 创建主题状态管理
const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      // 默认为浅色模式
      mode: "light",

      // 切换主题模式
      toggleMode: () =>
        set((state) => ({
          mode: state.mode === "light" ? "dark" : "light",
        })),

      // 设置特定主题模式
      setMode: (mode) => set({ mode }),
    }),
    {
      name: "theme-storage",
    }
  )
);

export default useThemeStore;
