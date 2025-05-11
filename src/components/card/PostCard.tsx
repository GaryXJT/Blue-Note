import React, { useState, useRef, useEffect, memo } from "react";
import { Post } from "@/api/types";
import { HeartOutlined, HeartFilled } from "@ant-design/icons";
import PostModal from "../post/PostModal";
import styles from "./PostCard.module.scss";
import { Skeleton } from "antd";
import { likePost, unlikePost } from "@/api/services/posts";
import { message } from "antd";
import useAuthStore from "@/store/useAuthStore";

interface PostCardProps {
  post: Post;
  onHeightChange?: (postId: string, height: number) => void;
}

// 骨架屏组件
export const PostCardSkeleton: React.FC = () => {
  return (
    <div className={styles.skeleton}>
      <div className={styles.imageWrapper}>
        <div className={styles.imageSkeleton} />
      </div>
      <div className={styles.content}>
        <div className={styles.titleSkeleton} />
        <div className={styles.authorSkeleton}>
          <div className={styles.avatarSkeleton} />
          <div className={styles.nameSkeleton} />
        </div>
      </div>
    </div>
  );
};

// 使用memo优化不必要的重渲染
const PostCard: React.FC<PostCardProps> = memo(({ post, onHeightChange }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isLiked, setIsLiked] = useState(post.likedByUser || false);
  const [likesCount, setLikesCount] = useState(post.likes);
  // 默认比例设置根据帖子类型，避免初始比例变化引起的抽搐
  const [imageRatio, setImageRatio] = useState<string>(getDefaultRatio(post));
  const cardRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const heightUpdateTimer = useRef<NodeJS.Timeout | null>(null);
  const user = useAuthStore((state) => state.user);
  // 添加一个ref来存储是否已经报告过高度，避免重复通知
  const hasReportedHeight = useRef<boolean>(false);

  // 根据帖子类型获取默认的图片比例
  function getDefaultRatio(post: Post): string {
    // 如果帖子有预设宽高比例，使用预设值
    if (post.width && post.height) {
      const ratio = (post.height / post.width) * 100;
      return `${ratio}%`;
    }

    // 否则根据帖子类型返回默认比例
    if (post.type === "image") {
      return "100%"; // 1:1方形比例
    } else if (post.type === "video") {
      return "56.25%"; // 16:9视频比例
    }

    // 默认使用4:3比例
    return "75%";
  }

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止冒泡，避免同时打开Modal

    // 如果用户未登录，则提示登录
    if (!user?.userId) {
      message.error("请先登录");
      return;
    }

    try {
      // 先更新UI状态，再发送API请求
      if (isLiked) {
        // 如果已经点赞，则取消点赞
        setIsLiked(false);
        setLikesCount((prev) => prev - 1);
        await unlikePost(post.id, user.userId);
      } else {
        // 如果未点赞，则添加点赞
        setIsLiked(true);
        setLikesCount((prev) => prev + 1);
        await likePost(post.id, user.userId);
      }
    } catch (error) {
      console.error(`${isLiked ? "取消点赞" : "点赞"}失败:`, error);
      message.error(`${isLiked ? "取消点赞" : "点赞"}失败，请稍后再试`);
      // 请求失败时恢复UI状态
      setIsLiked(!isLiked);
      setLikesCount((prev) => (isLiked ? prev + 1 : prev - 1));
    }
  };

  // 处理图片加载完成事件
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;

    // 获取图片实际宽高
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;

    if (imgWidth && imgHeight) {
      // 计算实际宽高比，偏差太小(±5%)就不更新，避免微小变化引起的抽搐
      const newRatio = (imgHeight / imgWidth) * 100;
      const currentRatio = parseFloat(imageRatio);
      const diff = Math.abs(newRatio - currentRatio);

      if (diff > currentRatio * 0.05) {
        // 只有差异超过5%才更新
        setImageRatio(`${newRatio}%`);
      }
    }

    setImageLoaded(true);

    // 图片加载完成后等待一小段时间再报告高度，确保布局稳定
    setTimeout(() => {
      reportHeight();
    }, 50);
  };

  // 封装一个高度报告函数，减少代码重复
  const reportHeight = () => {
    if (!onHeightChange || !cardRef.current || hasReportedHeight.current) {
      return;
    }

    // 使用RAF确保获取准确的高度
    requestAnimationFrame(() => {
      if (cardRef.current) {
        // 为了确保计算稳定，多次测量取平均值
        let totalHeight = 0;
        const measureCount = 3;

        for (let i = 0; i < measureCount; i++) {
          totalHeight += cardRef.current.offsetHeight;
        }

        const averageHeight = Math.round(totalHeight / measureCount);
        onHeightChange(post.id, averageHeight);
        hasReportedHeight.current = true; // 标记已经报告过高度
      }
    });
  };

  // 获取图片URL
  const getImageUrl = () => {
    if (!post.coverUrl) return "";

    return post.coverUrl.startsWith("http")
      ? post.coverUrl
      : `http://localhost:8080${post.coverUrl}`;
  };

  // 卡片高度变化时通知父组件
  useEffect(() => {
    if (imageLoaded && !hasReportedHeight.current) {
      reportHeight();
    }

    // 清理函数
    return () => {
      if (heightUpdateTimer.current) {
        clearTimeout(heightUpdateTimer.current);
      }
    };
  }, [imageLoaded, imageRatio, post.id]);

  // 图片加载错误处理
  const handleImageError = () => {
    console.error(`Failed to load image for post: ${post.id}`);
    // 保持原来的比例，不要改变
    setImageLoaded(true);

    // 通知高度变化
    setTimeout(() => {
      reportHeight();
    }, 50);
  };

  return (
    <>
      <div
        className={styles.card}
        onClick={() => setIsModalOpen(true)}
        ref={cardRef}
      >
        <div
          className={styles.imageWrapper}
          style={{ paddingBottom: imageRatio }}
        >
          <img
            ref={imgRef}
            src={getImageUrl()}
            alt={post.title}
            className={styles.image}
            loading="lazy"
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{ opacity: imageLoaded ? 1 : 0 }} // 使用opacity代替display确保正确计算高度
          />

          {/* 加载时显示骨架屏 */}
          {!imageLoaded && (
            <div className={styles.imageSkeleton}>
              <Skeleton.Image active className={styles.skeletonImage} />
            </div>
          )}
        </div>
        <div className={styles.content}>
          <h3 className={styles.title}>{post.title}</h3>
          <div className={styles.footer}>
            <div className={styles.author}>
              <div className={styles.info}>
                <div className={styles.avatar}>
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    loading="lazy"
                    onError={(e) => {
                      // 头像加载失败时设置默认头像
                      (e.target as HTMLImageElement).src =
                        "static/pic/default-avatar.jpg";
                    }}
                  />
                </div>
                <span className={styles.name}>{post.author.name}</span>
              </div>
              <div
                className={`${styles.likes} ${isLiked ? styles.liked : ""}`}
                onClick={handleLike}
              >
                {isLiked ? <HeartFilled /> : <HeartOutlined />}
                <span>{likesCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PostModal
        post={post}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isLiked={isLiked}
        onLike={handleLike}
        likesCount={likesCount}
      />
    </>
  );
});

export default PostCard;
