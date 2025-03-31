import React, { useState } from "react";
import Link from "next/link";
import {
  CompassOutlined,
  PlusCircleOutlined,
  BellOutlined,
  HeartOutlined,
  SearchOutlined,
  StarOutlined,
  MessageOutlined,
  MenuOutlined,
  UserOutlined,
  LikeOutlined,
  TeamOutlined,
  InfoCircleOutlined,
  SettingOutlined,
  LogoutOutlined,
  QuestionCircleOutlined,
  KeyOutlined,
  PlusOutlined,
  MoonOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { Avatar, Dropdown, Menu, message } from "antd";
import styles from "./Sidebar.module.scss";
import useAuthStore from "@/store/useAuthStore";
import LoginModal from "../auth/LoginModal";
import type { MenuProps } from "antd";

interface SidebarProps {
  onViewProfile: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onViewProfile }) => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [loginModalVisible, setLoginModalVisible] = useState(false);

  // 处理登录点击
  const handleLoginClick = () => {
    setLoginModalVisible(true);
  };

  // 处理退出登录
  const handleLogout = () => {
    logout();
    message.success("退出登录成功");
  };

  // 处理关于小蓝书点击
  const handleAboutClick = () => {
    message.info("关于小蓝书功能即将上线");
  };

  // 处理深色模式切换
  const handleDarkModeToggle = () => {
    message.info("深色模式功能即将上线");
  };

  // 更多下拉菜单项
  const dropdownItems: MenuProps["items"] = [
    {
      key: "about",
      label: "关于小蓝书",
      icon: <InfoCircleOutlined />,
      onClick: handleAboutClick,
    },
    {
      key: "privacy",
      label: "隐私、协议",
      icon: <QuestionCircleOutlined />,
      onClick: () => message.info("隐私协议功能即将上线"),
    },
    {
      key: "help",
      label: "帮助与客服",
      icon: <MessageOutlined />,
      onClick: () => message.info("客服功能即将上线"),
    },
    {
      type: "divider",
    },
    {
      key: "visit",
      label: "访问方式",
      icon: <TeamOutlined />,
      onClick: () => message.info("访问方式设置即将上线"),
    },
    {
      key: "shortcut",
      label: "键盘快捷键",
      icon: <KeyOutlined />,
      onClick: () => message.info("快捷键功能即将上线"),
    },
    {
      key: "add",
      label: "添加小蓝书到桌面",
      icon: <PlusOutlined />,
      onClick: () => message.info("添加到桌面功能即将上线"),
    },
    {
      type: "divider",
    },
    {
      key: "settings",
      label: "设置",
      icon: <SettingOutlined />,
      onClick: () => message.info("设置功能即将上线"),
    },
    {
      key: "darkMode",
      label: "深色模式",
      icon: <MoonOutlined />,
      onClick: handleDarkModeToggle,
    },
  ];

  // 如果用户已登录，添加退出登录选项
  if (isLoggedIn) {
    dropdownItems.push({
      key: "logout",
      label: "退出登录",
      icon: <LogoutOutlined />,
      onClick: handleLogout,
      danger: true,
    });
  }

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.navItem}>
          <div>
            <CompassOutlined style={{ fontSize: "22px" }} />
            <span>发现</span>
          </div>
        </Link>
        <Link href="/post/publish" className={styles.navItem}>
          <div>
            <PlusCircleOutlined style={{ fontSize: "22px" }} />
            <span>发布</span>
          </div>
        </Link>
        <Link href="/post/notifications" className={styles.navItem}>
          <div>
            <BellOutlined style={{ fontSize: "22px" }} />
            <span>通知</span>
          </div>
        </Link>

        {isLoggedIn && (
          <div
            className={styles.navItem}
            onClick={onViewProfile}
            style={{ cursor: "pointer" }}
          >
            <div>
              <Avatar
                src={user?.avatar}
                icon={<UserOutlined />}
                size={22}
                style={{ fontSize: "22px" }}
              />
              <span>我</span>
            </div>
          </div>
        )}
      </nav>

      {!isLoggedIn && (
        <div className={styles.info}>
          <button className={styles.loginBtn} onClick={handleLoginClick}>
            登录
          </button>
          <ul className={styles.features}>
            <div className={styles.title}>马上登录即可</div>
            <li>
              <HeartOutlined />
              <span>刷到更懂你的优质内容</span>
            </li>
            <li>
              <SearchOutlined />
              <span>搜索更新和热门、探索信息</span>
            </li>
            <li>
              <StarOutlined />
              <span>查看收藏、保留好记忆</span>
            </li>
            <li>
              <MessageOutlined />
              <span>与他人互动抽互动、交流</span>
            </li>
          </ul>
        </div>
      )}

      <div className={styles.more}>
        <Dropdown
          menu={{ items: dropdownItems }}
          placement="topLeft"
          trigger={["click"]}
          overlayClassName={styles.moreDropdown}
        >
          <button className={styles.moreBtn}>
            <div>
              <MenuOutlined style={{ fontSize: "22px" }} />
              <span>更多</span>
            </div>
          </button>
        </Dropdown>
      </div>

      {/* 登录弹窗 */}
      <LoginModal
        visible={loginModalVisible}
        onCancel={() => setLoginModalVisible(false)}
      />
    </aside>
  );
};

export default Sidebar;
