import React, { useState } from "react";
import { Post } from "@/api/types";
import {
  CloseOutlined,
  LeftOutlined,
  RightOutlined,
  HeartOutlined,
  HeartFilled,
  PlusOutlined,
  CheckOutlined,
  UserAddOutlined,
  UserOutlined,
} from "@ant-design/icons";
import styles from "./PostModal.module.scss";
import { followAuthor, unfollowAuthor } from "@/api/services/posts";
import { message } from "antd";
import useAuthStore from "@/store/useAuthStore";
import { useRouter } from "next/router";

interface PostModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  isLiked?: boolean;
  onLike?: (e: React.MouseEvent) => void;
  likesCount?: number;
}

const PostModal: React.FC<PostModalProps> = ({
  post,
  isOpen,
  onClose,
  isLiked = false,
  onLike,
  likesCount,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFollowing, setIsFollowing] = useState(post.followedByUser || false);
  const images = post.files || [post.coverUrl];
  const displayLikes = likesCount !== undefined ? likesCount : post.likes;
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // 如果用户未登录，则提示登录
    if (!user?.userId) {
      message.error("请先登录");
      return;
    }

    try {
      if (isFollowing) {
        // 如果已关注，则取消关注
        await unfollowAuthor(post.id, user.userId);
        setIsFollowing(false);
      } else {
        // 如果未关注，则添加关注
        await followAuthor(post.id, user.userId);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error(`${isFollowing ? "取消关注" : "关注"}失败:`, error);
      message.error(`${isFollowing ? "取消关注" : "关注"}失败，请稍后再试`);
    }
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    if (onLike) {
      onLike(e);
    }
  };

  const handleViewAuthorProfile = () => {
    const authorId = post.userId || post.author?.id;
    if (authorId) {
      // 关闭当前模态框
      onClose();
      // 导航到作者的个人资料页
      router.push(`/?profile=${authorId}`, undefined, { shallow: true });
    } else {
      message.error("无法获取作者信息");
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          <CloseOutlined />
        </button>

        <div className={styles.content}>
          <div className={styles.imageSection}>
            <div className={styles.imageWrapper}>
              <img
                src={
                  images[currentIndex]!.startsWith("http")
                    ? images[currentIndex]
                    : `http://localhost:8080${images[currentIndex]}`
                }
                alt={`${post.title} - 图片 ${currentIndex + 1}`}
                className={styles.mainImage}
              />
            </div>
            {images.length > 1 && (
              <>
                <button
                  className={`${styles.navBtn} ${styles.prevBtn}`}
                  onClick={handlePrev}
                >
                  <LeftOutlined />
                </button>
                <button
                  className={`${styles.navBtn} ${styles.nextBtn}`}
                  onClick={handleNext}
                >
                  <RightOutlined />
                </button>
                <div className={styles.dots}>
                  {images.map((_, index) => (
                    <button
                      key={index}
                      className={`${styles.dot} ${
                        index === currentIndex ? styles.active : ""
                      }`}
                      onClick={() => setCurrentIndex(index)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <div className={styles.infoSection}>
            <div className={styles.header}>
              <h2>{post.title}</h2>
              <div className={styles.author}>
                <img
                  src={post.author?.avatar || "static/pic/default-avatar.jpg"}
                  alt={
                    post.author?.name ||
                    post.username ||
                    post.nickname ||
                    "未知用户"
                  }
                  onClick={handleViewAuthorProfile}
                  className={styles.authorAvatar}
                  onError={(e) => {
                    // 头像加载失败时设置默认头像
                    (e.target as HTMLImageElement).src =
                      "static/pic/default-avatar.jpg";
                  }}
                />
                <span
                  onClick={handleViewAuthorProfile}
                  className={styles.authorName}
                >
                  {post.author?.name ||
                    post.username ||
                    post.nickname ||
                    "未知用户"}
                </span>
                <button
                  className={`${styles.followBtn} ${
                    isFollowing ? styles.following : ""
                  }`}
                  onClick={handleFollow}
                >
                  {isFollowing ? (
                    <>
                      <UserOutlined /> 已关注
                    </>
                  ) : (
                    <>
                      <UserAddOutlined /> 关注
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className={styles.stats}>
              <div
                className={`${styles.likes} ${isLiked ? styles.liked : ""}`}
                onClick={handleLikeClick}
              >
                {isLiked ? <HeartFilled /> : <HeartOutlined />}
                <span>{displayLikes}</span>
              </div>
              <div className={styles.time}>
                {new Date(post.createdAt).toLocaleDateString()}
              </div>
            </div>

            <div className={styles.description}>{post.content}</div>

            <div className={styles.comments}>
              <h3>评论</h3>
              <div className={styles.commentForm}>
                <textarea placeholder="写下你的评论..." />
                <button>发送</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostModal;
