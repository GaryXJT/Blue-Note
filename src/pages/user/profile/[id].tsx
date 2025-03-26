import { useRouter } from "next/router";
import { useEffect } from "react";
import Home from "@/pages/index";

// 这个页面只是一个包装器，实际上重用了首页的逻辑
export default function UserProfile() {
  const router = useRouter();

  // 如果直接访问这个页面（刷新或直接输入URL），
  // 我们需要确保首页组件知道应该显示个人资料
  useEffect(() => {
    // 这里不需要做任何事情，因为 Home 组件会检测 URL
    // 并相应地显示个人资料页面
  }, []);

  // 重用首页组件
  return <Home />;
}
