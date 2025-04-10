import React, { ReactNode } from "react";
import { Spin, Empty } from "antd";
import styles from "./Stats.module.scss";

interface TableCardProps {
  title: ReactNode;
  controls?: ReactNode;
  children: ReactNode;
  loading?: boolean;
  empty?: boolean;
}

const TableCard: React.FC<TableCardProps> = ({
  title,
  controls,
  children,
  loading = false,
  empty = false,
}) => {
  return (
    <div className={styles.tableCard}>
      <div className={styles.tableHeader}>
        <h3 className={styles.tableTitle}>{title}</h3>
        {controls && <div className={styles.tableControls}>{controls}</div>}
      </div>
      <div>
        {loading ? (
          <div className={styles.loading}>
            <Spin tip="加载中..." />
          </div>
        ) : empty ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" />
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default TableCard;
