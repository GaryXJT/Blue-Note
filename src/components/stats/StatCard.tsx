import React from "react";
import { Card, Tooltip } from "antd";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import styles from "./Stats.module.scss";

interface StatCardProps {
  title: string;
  value: number | string;
  unit?: string;
  prefix?: React.ReactNode;
  growth?: number;
  growthTitle?: string;
  tooltip?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  precision?: number;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit = "",
  prefix,
  growth,
  growthTitle = "较上周",
  tooltip,
  icon,
  loading = false,
  precision = 0,
}) => {
  const formatNumber = (num: number | string): string => {
    if (typeof num === "string") return num;

    if (num >= 10000) {
      return (num / 10000).toFixed(1) + "万";
    }

    return num.toLocaleString("zh-CN");
  };

  const renderGrowth = () => {
    if (growth === undefined || growth === null) return null;

    const isPositive = growth > 0;
    const color = isPositive ? "#52c41a" : "#ff4d4f";
    const icon = isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />;

    return (
      <div className={styles.growth} style={{ color }}>
        {icon} {Math.abs(growth).toFixed(precision)}%
        <span className={styles.growthTitle}>{growthTitle}</span>
      </div>
    );
  };

  return (
    <Card className={styles.statCard} bordered={false} loading={loading}>
      <div className={styles.statHeader}>
        <div className={styles.title}>
          {title}
          {tooltip && (
            <Tooltip title={tooltip}>
              <QuestionCircleOutlined className={styles.tooltipIcon} />
            </Tooltip>
          )}
        </div>
        {icon && <div className={styles.icon}>{icon}</div>}
      </div>
      <div className={styles.statValue}>
        {prefix && <span className={styles.prefix}>{prefix}</span>}
        <span className={styles.value}>{formatNumber(value)}</span>
        {unit && <span className={styles.unit}>{unit}</span>}
      </div>
      {renderGrowth()}
    </Card>
  );
};

export default StatCard;
