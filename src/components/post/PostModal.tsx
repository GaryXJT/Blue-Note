import React, { useState, useEffect, useRef } from "react";
import {
  Post,
  Comment,
  CommentsResponse,
  ApiResponse,
  CommentPostResponse,
} from "@/api/types";
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
  MessageOutlined,
  LikeOutlined,
  LikeFilled,
  CommentOutlined,
  SmileOutlined,
} from "@ant-design/icons";
import styles from "./PostModal.module.scss";
import { followAuthor, unfollowAuthor } from "@/api/services/posts";
import {
  getComments,
  getAllComments,
  createComment,
  likeComment,
  unlikeComment,
  getChildComments,
  checkCommentLikeStatus,
} from "@/api/services/comments";
import { message, Popover } from "antd";
import useAuthStore from "@/store/useAuthStore";
import { useRouter } from "next/router";
import { createPortal } from "react-dom";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

interface PostModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  isLiked?: boolean;
  onLike?: (e: React.MouseEvent) => void;
  likesCount?: number;
}

// 表情库
const EMOJI_LIST = [
  "😀",
  "😃",
  "😄",
  "😁",
  "😆",
  "😅",
  "🤣",
  "😂",
  "🙂",
  "🙃",
  "😉",
  "😊",
  "😇",
  "🥰",
  "😍",
  "😘",
  "😗",
  "😚",
  "😙",
  "😋",
  "😛",
  "😜",
  "😝",
  "🤑",
  "🤗",
  "🤭",
  "🤫",
  "🤔",
  "🤐",
  "🤨",
  "😐",
  "😑",
  "😶",
  "😏",
  "😒",
  "🙄",
  "😬",
  "🤥",
  "😌",
  "😔",
  "😪",
  "🤤",
  "😴",
  "😷",
  "🤒",
  "🤕",
  "🤢",
  "🤮",
  "🤧",
  "🥵",
  "🥶",
  "🥴",
  "😵",
  "🤯",
  "🤠",
  "🥳",
  "😎",
  "🤓",
  "👋",
  "👍",
  "👎",
  "❤️",
  "💖",
  "💘",
  "💝",
  "💗",
  "💓",
  "💕",
  "💞",
  "💌",
  "🔥",
  "⭐",
  "✨",
  "🎉",
  "👀",
  "💯",
  "💪",
  "👏",
  "🙏",
  "🎁",
];

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
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentContent, setCommentContent] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [commentsPage, setCommentsPage] = useState(1);
  const [totalComments, setTotalComments] = useState(0);
  const [replyingTo, setReplyingTo] = useState<{
    commentId: string;
    nickname: string;
    isChild?: boolean;
    rootId?: string;
    userId?: string;
  } | null>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const images = post.files || [post.coverUrl];
  const displayLikes = likesCount !== undefined ? likesCount : post.likes;
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  // 确保Portal挂载到body上，避免被父元素的样式影响
  useEffect(() => {
    setPortalElement(document.body);
    // 打开模态框时禁止滚动
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      // 关闭模态框时恢复滚动
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // 当模态框打开时，加载评论
  useEffect(() => {
    if (isOpen && post.id) {
      // 使用新的获取所有评论的接口，替代分页加载
      fetchAllComments();
    }
  }, [isOpen, post.id]);

  // 当有replyingTo时，自动聚焦输入框
  useEffect(() => {
    if (replyingTo && commentInputRef.current) {
      commentInputRef.current.focus();
    }
  }, [replyingTo]);

  // 格式化日期
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: zhCN });
    } catch (error) {
      return dateString;
    }
  };

  // 加载所有评论（不分页）
  const fetchAllComments = async () => {
    if (!post.id || isLoadingComments) return;

    setIsLoadingComments(true);
    try {
      const response = await getAllComments(post.id);

      const responseData = response.data as unknown as ApiResponse<{
        comments: Comment[];
        total: number;
      }>;

      if (responseData.code === 200) {
        const commentsData = responseData.data;

        // 处理评论数据，将所有嵌套子评论平铺
        const processedComments = commentsData.comments.map((comment) => {
          // 递归提取所有嵌套子评论并平铺
          const flattenedChildren: Comment[] = [];

          const extractChildren = (nestedComment: Comment) => {
            if (nestedComment.children && nestedComment.children.length > 0) {
              // 将直接子评论添加到平铺列表
              nestedComment.children.forEach((child) => {
                flattenedChildren.push(child);
                // 递归处理这个子评论的子评论
                extractChildren(child);
              });
            }
          };

          // 处理当前评论的子评论
          if (comment.children && comment.children.length > 0) {
            comment.children.forEach((child) => {
              flattenedChildren.push(child);
              extractChildren(child);
            });
          }

          // 返回处理后的评论，包含平铺的子评论
          return {
            ...comment,
            children: flattenedChildren,
          };
        });

        setComments(processedComments);
        setTotalComments(commentsData.total);
        // 不分页加载，没有更多数据了
        setHasMoreComments(false);
      } else {
        message.error(responseData.message || "获取评论失败");
      }
    } catch (error) {
      console.error("获取评论失败:", error);
      message.error("获取评论失败，请稍后再试");
    } finally {
      setIsLoadingComments(false);
    }
  };

  // 保留原来的分页加载方法，以备需要
  const fetchComments = async (page = 1) => {
    if (!post.id || isLoadingComments) return;

    setIsLoadingComments(true);
    try {
      const response = await getComments({
        postId: post.id,
        page,
        pageSize: 20,
      });

      const responseData =
        response.data as unknown as ApiResponse<CommentsResponse>;

      if (responseData.code === 200) {
        const commentsData = responseData.data;

        if (page === 1) {
          setComments(commentsData.comments);
        } else {
          setComments((prev) => [...prev, ...commentsData.comments]);
        }

        setTotalComments(commentsData.total);
        setHasMoreComments(commentsData.hasMore);
        setCommentsPage(page);
      } else {
        message.error(responseData.message || "获取评论失败");
      }
    } catch (error) {
      console.error("获取评论失败:", error);
      message.error("获取评论失败，请稍后再试");
    } finally {
      setIsLoadingComments(false);
    }
  };

  // 加载子评论
  const handleLoadChildComments = async (commentId: string) => {
    if (!post.id) return;

    try {
      const response = await getChildComments(post.id, commentId);

      const responseData =
        response.data as unknown as ApiResponse<CommentsResponse>;

      if (responseData.code === 200) {
        const childComments = responseData.data.comments;

        // 递归提取所有嵌套子评论
        const extractAllChildren = (comments: Comment[]): Comment[] => {
          const result: Comment[] = [];

          const extract = (comment: Comment) => {
            if (comment.children && comment.children.length > 0) {
              comment.children.forEach((child) => {
                result.push(child);
                extract(child);
              });
            }
          };

          comments.forEach((comment) => {
            result.push(comment);
            extract(comment);
          });

          return result;
        };

        // 提取所有嵌套的子评论
        const allNestedChildren = extractAllChildren(childComments);

        // 更新评论中的子评论，确保所有子评论都平铺在父评论下
        setComments((prevComments) =>
          prevComments.map((comment) => {
            if (comment.id === commentId) {
              // 将所有子评论平铺到父评论的children数组中
              return {
                ...comment,
                children: [...(comment.children || []), ...allNestedChildren],
              };
            }
            return comment;
          })
        );
      } else {
        message.error(responseData.message || "获取子评论失败");
      }
    } catch (error) {
      console.error("获取子评论失败:", error);
      message.error("获取子评论失败，请稍后再试");
    }
  };

  // 处理插入表情
  const handleInsertEmoji = (emoji: string) => {
    if (commentInputRef.current) {
      const input = commentInputRef.current;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;

      const newValue =
        commentContent.substring(0, start) +
        emoji +
        commentContent.substring(end);

      setCommentContent(newValue);

      // 设置光标位置
      setTimeout(() => {
        if (commentInputRef.current) {
          const newCursorPos = start + emoji.length;
          commentInputRef.current.focus();
          commentInputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  };

  // 表情选择器内容
  const emojiContent = (
    <div className={styles.emojiSelector}>
      {EMOJI_LIST.map((emoji, index) => (
        <span
          key={index}
          className={styles.emojiItem}
          onClick={() => handleInsertEmoji(emoji)}
        >
          {emoji}
        </span>
      ))}
    </div>
  );

  // 发布评论
  const handlePostComment = async () => {
    if (!commentContent.trim()) {
      message.warning("评论内容不能为空");
      return;
    }

    if (!user?.userId) {
      message.warning("请先登录");
      return;
    }

    try {
      const commentData = {
        postId: post.id,
        content: commentContent.trim(),
      } as any;

      // 如果是回复评论
      if (replyingTo) {
        // 设置父评论ID（不管是一级评论还是子评论，都是用这个评论的ID作为父ID）
        commentData.parentId = replyingTo.commentId;

        // 如果是回复的子评论，需要保留根评论ID
        if (replyingTo.rootId) {
          commentData.rootId = replyingTo.rootId;
        }

        // 设置被回复人的ID
        if (replyingTo.userId) {
          commentData.replyToId = replyingTo.userId;
        }
      }

      const response = await createComment(commentData);

      const responseData =
        response.data as unknown as ApiResponse<CommentPostResponse>;

      if (responseData.code === 200) {
        // 清空输入框和回复状态
        setCommentContent("");
        setReplyingTo(null);
        message.success("评论发布成功");

        // 重新获取所有评论，确保数据一致性
        fetchAllComments();
      } else {
        message.error(responseData.message || "发布评论失败");
      }
    } catch (error) {
      console.error("发布评论失败:", error);
      message.error("发布评论失败，请稍后再试");
    }
  };

  // 递归查找评论函数
  const findCommentById = (
    commentId: string,
    comments: Comment[]
  ): Comment | null => {
    for (const comment of comments) {
      if (comment.id === commentId) {
        return comment;
      }

      if (comment.children && comment.children.length > 0) {
        const found = findCommentById(commentId, comment.children);
        if (found) {
          return found;
        }
      }
    }

    return null;
  };

  // 递归更新评论树中的某个评论（用于点赞等操作）
  const updateCommentInTree = (
    commentId: string,
    updater: (comment: Comment) => Comment,
    commentList: Comment[]
  ): Comment[] => {
    return commentList.map((comment) => {
      // 如果是目标评论，直接更新
      if (comment.id === commentId) {
        return updater(comment);
      }

      // 如果有子评论，检查子评论中是否有目标评论
      if (comment.children && comment.children.length > 0) {
        // 检查子评论中是否有目标评论
        const updatedChildren = comment.children.map((child) =>
          child.id === commentId ? updater(child) : child
        );

        return {
          ...comment,
          children: updatedChildren,
        };
      }

      return comment;
    });
  };

  // 点赞评论
  const handleLikeComment = async (comment: Comment, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user?.userId) {
      message.warning("请先登录");
      return;
    }

    try {
      if (comment.likedByUser) {
        await unlikeComment(comment.id);
      } else {
        await likeComment(comment.id);
      }

      // 使用递归更新评论树中的点赞状态
      setComments((prevComments) =>
        updateCommentInTree(
          comment.id,
          (c) => ({
            ...c,
            likedByUser: !c.likedByUser,
            likes: c.likedByUser ? c.likes - 1 : c.likes + 1,
          }),
          prevComments
        )
      );
    } catch (error) {
      console.error(
        `${comment.likedByUser ? "取消点赞" : "点赞"}评论失败:`,
        error
      );
      message.error(
        `${comment.likedByUser ? "取消点赞" : "点赞"}评论失败，请稍后再试`
      );
    }
  };

  // 回复评论
  const handleReplyComment = (
    comment: Comment,
    isChild: boolean = false,
    rootId?: string
  ) => {
    // 找到实际要回复的用户信息
    const commentToReply = comment;

    setReplyingTo({
      commentId: isChild ? rootId! : comment.id, // 设置正确的父评论ID
      nickname: commentToReply.nickname,
      isChild,
      rootId,
      userId: commentToReply.userId,
    });

    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  };

  // 取消回复
  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  // 渲染评论项
  const renderCommentItem = (
    comment: Comment,
    isChild: boolean = false,
    rootId?: string
  ) => (
    <div
      key={comment.id}
      className={isChild ? styles.childItem : styles.commentItem}
    >
      <div className={styles.commentHeader}>
        <img
          src={comment.avatar || "static/pic/default-avatar.jpg"}
          alt={comment.nickname}
          className={styles.avatar}
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/?profile=${comment.userId}`, undefined, {
              shallow: true,
            });
            onClose();
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "static/pic/default-avatar.jpg";
          }}
        />
        <div className={styles.userInfo}>
          <span
            className={styles.username}
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/?profile=${comment.userId}`, undefined, {
                shallow: true,
              });
              onClose();
            }}
          >
            {comment.nickname}
          </span>

          {(comment.isAuthor || comment.isAdmin) && (
            <span className={styles.badges}>
              {comment.isAuthor && (
                <span className={styles.authorBadge}>作者</span>
              )}
              {comment.isAdmin && (
                <span className={styles.adminBadge}>管理员</span>
              )}
            </span>
          )}
        </div>

        <div className={styles.actions}>
          <span className={styles.time}>{formatDate(comment.createdAt)}</span>
          <button
            className={`${styles.likeBtn} ${
              comment.likedByUser ? styles.liked : ""
            }`}
            onClick={(e) => handleLikeComment(comment, e)}
          >
            {comment.likedByUser ? <LikeFilled /> : <LikeOutlined />}
            <span className={styles.count}>{comment.likes}</span>
          </button>
        </div>
      </div>

      <div className={styles.commentContent}>
        {comment.replyToName && (
          <span className={styles.replyTo}>回复 {comment.replyToName}：</span>
        )}
        {comment.content}
      </div>

      <div className={styles.commentFooter}>
        <button
          className={styles.replyBtn}
          onClick={() =>
            handleReplyComment(comment, isChild, rootId || comment.id)
          }
        >
          <CommentOutlined /> 回复
        </button>
      </div>

      {!isChild && comment.children && comment.children.length > 0 && (
        <div className={styles.childComments}>
          {comment.children.map((child) =>
            renderCommentItem(child, true, comment.id)
          )}
        </div>
      )}
    </div>
  );

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleViewAuthorProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  if (!isOpen || !portalElement) return null;

  // 使用Portal渲染到body，避免z-index和样式冲突问题
  return createPortal(
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
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentIndex(index);
                      }}
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
              <h3>评论 {totalComments > 0 ? `(${totalComments})` : ""}</h3>

              <div className={styles.commentForm}>
                {replyingTo && (
                  <div className={styles.replyingTo}>
                    <span>
                      回复 <b>{replyingTo.nickname}</b>
                    </span>
                    <button
                      className={styles.cancelReply}
                      onClick={handleCancelReply}
                    >
                      取消
                    </button>
                  </div>
                )}

                <div className={styles.commentInputWrapper}>
                  <textarea
                    placeholder={
                      user?.userId ? "写下你的评论..." : "请先登录再发表评论"
                    }
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    ref={commentInputRef}
                    disabled={!user?.userId}
                  />

                  {typeof window !== "undefined" && (
                    <div className={styles.commentEmojiButton}>
                      <Popover
                        content={emojiContent}
                        trigger="click"
                        placement="top"
                        overlayClassName={styles.emojiPopover}
                        autoAdjustOverflow={true}
                        destroyTooltipOnHide={true}
                      >
                        <button type="button">
                          <SmileOutlined />
                        </button>
                      </Popover>
                    </div>
                  )}
                </div>

                <button
                  className={styles.sendBtn}
                  onClick={handlePostComment}
                  disabled={!user?.userId || !commentContent.trim()}
                >
                  发送
                </button>
              </div>

              <div className={styles.commentList}>
                {isLoadingComments && comments.length === 0 ? (
                  <div className={styles.loading}>加载评论中...</div>
                ) : comments.length > 0 ? (
                  <>{comments.map((comment) => renderCommentItem(comment))}</>
                ) : (
                  <div className={styles.noComments}>
                    <MessageOutlined className={styles.icon} />
                    <span className={styles.text}>暂无评论，快来抢沙发～</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    portalElement
  );
};

export default PostModal;
