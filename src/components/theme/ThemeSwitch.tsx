import React from "react";
import { Switch } from "antd";
import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import useThemeStore from "@/store/useThemeStore";
import styles from "./ThemeSwitch.module.scss";

/**
 * 主题切换开关组件
 */
const ThemeSwitch: React.FC = () => {
  const { mode, toggleMode } = useThemeStore();

  const handleChange = () => {
    toggleMode();
  };

  return (
    <div className={styles.themeSwitchContainer}>
      <Switch
        checked={mode === "dark"}
        onChange={handleChange}
        checkedChildren={<MoonOutlined />}
        unCheckedChildren={<SunOutlined />}
        className={styles.themeSwitch}
      />
    </div>
  );
};

export default ThemeSwitch;
