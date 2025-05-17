import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./Header.module.scss";
import { SearchOutlined, MoonOutlined, SunOutlined } from "@ant-design/icons";
import { Switch } from "antd";
import useThemeStore from "@/store/useThemeStore";
import { useRouter } from "next/router";

interface HeaderProps {
  onSearch?: (searchText: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onSearch }) => {
  const { mode, toggleMode } = useThemeStore();
  const [searchText, setSearchText] = useState("");
  const router = useRouter();

  const handleThemeChange = () => {
    toggleMode();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const handleSearch = () => {
    if (searchText.trim()) {
      console.log("执行搜索：", searchText);

      // 如果传入了搜索回调函数，则调用
      if (onSearch) {
        onSearch(searchText.trim());
      } else {
        // 否则使用路由跳转到带有搜索参数的首页
        router.push(`/?search=${encodeURIComponent(searchText.trim())}`);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
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
            value={searchText}
            onChange={handleSearchChange}
            onKeyPress={handleKeyPress}
          />
          <button className={styles.searchButton} onClick={handleSearch}>
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
