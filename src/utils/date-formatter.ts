/**
 * 日期时间格式化工具
 * 用于处理日期时间的格式化和转换
 */

/**
 * 将UTC时间格式化为中国标准时间格式
 * @param dateStr 日期字符串，如 "2025-03-30T09:21:45.66Z"
 * @param format 格式化选项，默认为 "datetime"
 * @returns 格式化后的日期时间字符串
 */
export const formatDateTime = (
  dateStr: string | Date,
  format: "datetime" | "date" | "time" = "datetime"
): string => {
  if (!dateStr) return "-";

  try {
    // 创建Date对象
    const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;

    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      console.warn(`无效的日期: ${dateStr}`);
      return "-";
    }

    // 获取年月日时分秒
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    // 根据格式返回对应字符串
    switch (format) {
      case "date":
        return `${year}-${month}-${day}`;
      case "time":
        return `${hours}:${minutes}:${seconds}`;
      case "datetime":
      default:
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
  } catch (error) {
    console.error("日期格式化错误:", error);
    return "-";
  }
};

/**
 * 计算相对时间（如：5分钟前，1小时前，昨天等）
 * @param dateStr 日期字符串
 * @returns 相对时间字符串
 */
export const getRelativeTime = (dateStr: string | Date): string => {
  if (!dateStr) return "-";

  try {
    const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    // 转换为秒
    const diffSec = Math.floor(diffMs / 1000);

    // 小于1分钟
    if (diffSec < 60) {
      return "刚刚";
    }

    // 小于1小时
    if (diffSec < 3600) {
      return `${Math.floor(diffSec / 60)}分钟前`;
    }

    // 小于24小时
    if (diffSec < 86400) {
      return `${Math.floor(diffSec / 3600)}小时前`;
    }

    // 小于48小时
    if (diffSec < 172800) {
      return "昨天";
    }

    // 小于7天
    if (diffSec < 604800) {
      return `${Math.floor(diffSec / 86400)}天前`;
    }

    // 小于30天
    if (diffSec < 2592000) {
      return `${Math.floor(diffSec / 604800)}周前`;
    }

    // 大于30天，返回具体日期
    return formatDateTime(date, "date");
  } catch (error) {
    console.error("计算相对时间错误:", error);
    return "-";
  }
};
