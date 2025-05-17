import React from "react";
import { Menu, Button } from "antd";
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
import { message } from "antd";
import useAuthStore from "@/store/useAuthStore";

interface SideMenuProps {
  activeMenu: MenuType;
  onMenuChange: (menu: MenuType) => void;
}

const SideMenu: React.FC<SideMenuProps> = ({ activeMenu, onMenuChange }) => {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = currentUser?.role === "admin";

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

  const handleMenuClick = (key: MenuType) => {
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
    // 将key转换为MenuType并调用onMenuChange
    const menuKey = key as MenuType;
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
    </div>
  );
};

export default SideMenu;
