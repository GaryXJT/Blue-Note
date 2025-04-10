import React, { ReactNode } from "react";
import { Spin, Empty } from "antd";
import styles from "./Stats.module.scss";

interface ChartCardProps {
  title: ReactNode;
  controls?: ReactNode;
  children: ReactNode;
  loading?: boolean;
  empty?: boolean;
  height?: number;
}

const ChartCard: React.FC<ChartCardProps> = ({
  title,
  controls,
  children,
  loading = false,
  empty = false,
  height = 300,
}) => {
  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>{title}</h3>
        {controls && <div className={styles.chartControls}>{controls}</div>}
      </div>
      <div
        className={`${styles.chartContent} ${
          empty && !loading ? styles.empty : ""
        }`}
        style={{ height }}
      >
        {loading ? (
          <Spin tip="加载中..." />
        ) : empty ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" />
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default ChartCard;
