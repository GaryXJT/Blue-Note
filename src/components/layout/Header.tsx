import React from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./Header.module.scss";
import {
  SearchOutlined,
  MoonOutlined,
  SunOutlined,
} from "@ant-design/icons";
import { Switch } from "antd";
import useThemeStore from "@/store/useThemeStore";

const Header: React.FC = () => {
  const { mode, toggleMode } = useThemeStore();

  const handleThemeChange = () => {
    toggleMode();
  };

  return (
    <header className={styles.header}>
      <div className={styles.content}>
        <Link href="/" className={styles.logo}>
          <Image src="/logo.svg" alt="小蓝书" width={80} height={24} />
        </Link>
        <div className={styles.search}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="搜索感兴趣的内容"
          />
          <button className={styles.searchButton}>
            <SearchOutlined />
          </button>
        </div>

        <div className={styles.themeSwitch}>
          <Switch
            checked={mode === "dark"}
            onChange={handleThemeChange}
            checkedChildren={<MoonOutlined />}
            unCheckedChildren={<SunOutlined />}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
