import React, { useState } from "react";
import { Menu, Button, message } from "antd";
import {
  HomeOutlined,
  UserOutlined,
  AppstoreOutlined,
  FileOutlined,
  FileAddOutlined,
  BellOutlined,
  SettingOutlined,
  TeamOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";
import styles from "./SideMenu.module.scss";
import { MenuType } from "@/api/types";
import { useRouter } from "next/router";
import useAuthStore from "@/store/useAuthStore";
import LoginModal from "@/components/auth/LoginModal";

interface SideMenuProps {
  activeMenu: MenuType;
  onMenuChange: (menu: MenuType) => void;
}

const SideMenu: React.FC<SideMenuProps> = ({ activeMenu, onMenuChange }) => {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const isAdmin = currentUser?.role === "admin";
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<MenuType | null>(null);

  // 菜单项配置
  const menuItems = [
    {
      key: "works",
      icon: <AppstoreOutlined />,
      label: "笔记管理",
    },
    {
      key: "drafts",
      icon: <FileOutlined />,
      label: "草稿箱",
    },
    {
      key: "notifications",
      icon: <BellOutlined />,
      label: "通知中心",
    },
  ];

  const checkAuth = (key: MenuType): boolean => {
    // 如果用户已登录，直接返回true
    if (isLoggedIn) return true;

    // 未登录情况下需要鉴权的路由
    const authRoutes: MenuType[] = [
      "publish",
      "notifications",
      "drafts",
      "works",
      "admin-posts",
      "users",
      "stats",
    ];

    if (authRoutes.includes(key)) {
      // 保存用户想要访问的路由
      setPendingRoute(key);
      // 显示登录框
      setLoginModalVisible(true);

      // 显示提示信息
      let routeName = "";
      switch (key) {
        case "publish":
          routeName = "发布笔记";
          break;
        case "notifications":
          routeName = "通知中心";
          break;
        case "drafts":
          routeName = "草稿箱";
          break;
        case "works":
          routeName = "笔记管理";
          break;
        case "admin-posts":
          routeName = "后台笔记管理";
          break;
        case "users":
          routeName = "用户管理";
          break;
        case "stats":
          routeName = "数据统计";
          break;
      }
      message.warning(`请先登录后再访问${routeName}`);
      return false;
    }

    return true;
  };

  const handleMenuClick = (key: MenuType) => {
    // 检查权限
    if (!checkAuth(key)) return;

    onMenuChange(key);
    // 根据菜单类型改变 URL
    switch (key) {
      case "home":
        router.push("/post/home");
        break;
      case "works":
        router.push("/post/works");
        break;
      case "drafts":
        router.push("/post/drafts");
        break;
      case "publish":
        router.push("/post/publish"); // 默认显示图文上传标签页
        break;
      case "notifications":
        router.push("/post/notifications");
        break;
    }
  };

  // 处理管理员菜单点击
  const handleAdminMenuClick = ({ key }: { key: string }) => {
    // 将key转换为MenuType
    const menuKey = key as MenuType;

    // 检查权限
    if (!checkAuth(menuKey)) return;

    onMenuChange(menuKey);

    // 根据点击的菜单项执行不同的操作
    switch (menuKey) {
      case "admin-posts":
        console.log("进入管理员笔记管理");
        router.push("/post/admin-posts");
        break;
      case "users":
        console.log("进入用户管理");
        router.push("/post/users");
        break;
      case "stats":
        console.log("进入数据统计");
        router.push("/post/stats");
        break;
    }
  };

  // 登录成功后的回调
  const handleLoginSuccess = () => {
    setLoginModalVisible(false);

    // 如果有待处理的路由，登录成功后跳转
    if (pendingRoute) {
      const route = pendingRoute;
      setPendingRoute(null);
      handleMenuClick(route);
    }
  };

  return (
    <div className={styles.sideMenuContainer}>
      <div
        className={styles.publishButton}
        onClick={() => handleMenuClick("publish")}
      >
        <FileAddOutlined />
        <span>发布笔记</span>
      </div>
      <div className={styles.divider} />
      <Menu
        className={styles.menu}
        mode="inline"
        selectedKeys={[activeMenu]}
        onClick={({ key }) => handleMenuClick(key as MenuType)}
        items={menuItems}
      />

      {/* 只有管理员才能看到以下内容 */}
      {isAdmin && (
        <>
          <div className={styles.divider} />
          {/* 管理员功能提示文字 */}
          <div className={styles.adminLabel}>管理员功能</div>

          {/* 管理员按钮区域 */}
          <div className={styles.adminButtonsContainer}>
            <Menu
              className={styles.adminMenu}
              mode="inline"
              selectedKeys={[activeMenu]}
              onClick={handleAdminMenuClick}
              items={[
                {
                  key: "admin-posts",
                  icon: <AppstoreOutlined />,
                  label: "后台笔记管理",
                },
                {
                  key: "users",
                  icon: <TeamOutlined />,
                  label: "用户管理",
                },
                {
                  key: "stats",
                  icon: <DatabaseOutlined />,
                  label: "数据统计",
                },
              ]}
            />
          </div>
        </>
      )}

      {/* 登录弹窗 */}
      <LoginModal
        visible={loginModalVisible}
        onCancel={() => {
          setLoginModalVisible(false);
          setPendingRoute(null);
        }}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default SideMenu;
