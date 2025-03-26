import React, { useState, useEffect } from "react";
import { Tabs, Button, message } from "antd";
import {
  UserOutlined,
  EnvironmentOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import styles from "./ProfileContent.module.scss";
import Waterfall from "../layout/Waterfall";
import useAuthStore from "@/store/useAuthStore";
import { useRouter } from "next/router";
import EditProfileModal from "./EditProfileModal";
import { UserInfo } from "@/types";
import { profileAPI } from "@/api/services"; // 导入profile API

interface ProfileContentProps {
  activeProfileTab: string;
  setActiveProfileTab: (tab: string) => void;
  userInfo: UserInfo;
  userHasNoPosts: boolean;
  profilePosts: any[];
  isLoadingPosts: boolean;
  handleLoadMorePosts: () => void;
  handleMenuChange: (menu: string) => void;
  onBackToHome?: () => void;
}

const ProfileContent: React.FC<ProfileContentProps> = ({
  activeProfileTab,
  setActiveProfileTab,
  userInfo,
  userHasNoPosts,
  profilePosts,
  isLoadingPosts,
  handleLoadMorePosts,
  handleMenuChange,
  onBackToHome,
}) => {
  // 从 Zustand 获取登录状态和用户信息
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const currentUser = useAuthStore((state) => state.user);

  // 获取路由信息，用于提取 URL 中的 userId
  const router = useRouter();
  const { id } = router.query;

  // 判断是否是当前登录用户的资料页
  const [isSelf, setIsSelf] = useState(false);

  // 关注状态
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoadingFollow, setIsLoadingFollow] = useState(false);

  // 编辑资料弹窗状态
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  // 处理标签页切换
  const handleTabChange = (key: string) => {
    setActiveProfileTab(key);
  };

  // 根据 URL 中的 userId 和当前登录用户的 userId 判断是否是自己的资料页
  useEffect(() => {
    if (isLoggedIn && currentUser?.userId && id) {
      // 如果 URL 中的 id 与当前登录用户的 userId 一致，则是自己的资料页
      setIsSelf(id === currentUser.userId);
    } else {
      setIsSelf(false);
    }
  }, [isLoggedIn, currentUser?.userId, id]);

  // 检查是否已关注该用户
  useEffect(() => {
    // 如果是自己的资料，不需要检查关注状态
    if (isSelf) return;

    // 如果未登录，不需要检查关注状态
    if (!isLoggedIn) return;

    // 如果没有用户ID，不需要检查
    if (!id) return;

    // 从API获取关注状态
    const checkFollowStatus = async () => {
      try {
        setIsLoadingFollow(true);
        const response = await profileAPI.checkFollowStatus(id as string);
        const isFollowing = (response.data as any)?.data?.isFollowing || false;
        setIsFollowing(isFollowing);
      } catch (error) {
        console.error("Failed to check follow status:", error);
      } finally {
        setIsLoadingFollow(false);
      }
    };

    checkFollowStatus();
  }, [isSelf, isLoggedIn, id]);

  // 处理关注/取消关注
  const handleFollowToggle = async () => {
    // 如果未登录，显示提示信息
    if (!isLoggedIn) {
      message.info("请先登录后再关注");
      return;
    }

    if (!id) {
      message.error("用户ID不存在");
      return;
    }

    setIsLoadingFollow(true);
    try {
      if (isFollowing) {
        // 取消关注
        await profileAPI.unfollowUser(id as string);
        message.success("已取消关注");
      } else {
        // 关注
        await profileAPI.followUser(id as string);
        message.success("关注成功");
      }
      // 切换关注状态
      setIsFollowing(!isFollowing);
    } catch (error: any) {
      console.error("关注操作失败:", error);
      message.error(error.response?.data?.message || "操作失败，请稍后再试");
    } finally {
      setIsLoadingFollow(false);
    }
  };

  // 处理打开编辑资料弹窗
  const handleOpenEditModal = () => {
    setIsEditModalVisible(true);
  };

  // 处理关闭编辑资料弹窗
  const handleCloseEditModal = () => {
    setIsEditModalVisible(false);
  };

  return (
    <div className={styles.container}>
      {/* 用户信息部分 */}
      <div className={styles.userProfileCard}>
        <div className={styles.userProfileContent}>
          <div className={styles.avatarContainer}>
            <img
              src={userInfo.avatar || "/images/default-avatar.png"}
              alt="用户头像"
              className={styles.avatar}
            />
          </div>

          <div className={styles.userInfo}>
            <div className={styles.nameRow}>
              <h1 className={styles.nickname}>{userInfo.nickname}</h1>
            </div>

            <div className={styles.accountId}>
              小蓝书号：{userInfo.username}
            </div>

            <div className={styles.bio}>{userInfo.bio || "认真吃饭"}</div>

            <div className={styles.location}>
              {userInfo.gender === "male" ? (
                <span className={styles.gender}>♂</span>
              ) : userInfo.gender === "female" ? (
                <span className={styles.gender}>♀</span>
              ) : (
                <span className={styles.gender}>⚧</span>
              )}
              {userInfo.location && (
                <>
                  <EnvironmentOutlined />
                  {userInfo.location}
                </>
              )}
            </div>

            <div className={styles.statsRow}>
              <div className={styles.statItem}>
                <div className={styles.statValue}>
                  {userInfo.postCount || 0}
                </div>
                <div className={styles.statLabel}>笔记</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue}>
                  {userInfo.followCount || 0}
                </div>
                <div className={styles.statLabel}>关注</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue}>
                  {userInfo.fansCount || 0}
                </div>
                <div className={styles.statLabel}>粉丝</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue}>
                  {userInfo.likeCount || 0}
                </div>
                <div className={styles.statLabel}>获赞与收藏</div>
              </div>
            </div>
          </div>

          <div className={styles.followButtonContainer}>
            {isSelf ? (
              <Button
                type="default"
                className={styles.editButton}
                onClick={handleOpenEditModal}
              >
                编辑资料
              </Button>
            ) : (
              <Button
                type={isFollowing ? "default" : "primary"}
                className={
                  isFollowing ? styles.followingButton : styles.followButton
                }
                onClick={handleFollowToggle}
                loading={isLoadingFollow}
              >
                {isFollowing ? (
                  <>
                    <CheckOutlined /> 已关注
                  </>
                ) : (
                  "关注"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className={styles.tabs}>
        <Tabs
          activeKey={activeProfileTab}
          onChange={handleTabChange}
          items={[
            {
              key: "posts",
              label: "笔记",
              children: (
                <div className={styles.notesSection}>
                  {userHasNoPosts ? (
                    <div className={styles.emptyContent}>
                      <div className={styles.emptyIcon}>
                        <img src="/images/empty-posts.png" alt="暂无笔记" />
                      </div>
                      <p>还没有发布任何笔记</p>
                      {isSelf && (
                        <button
                          className={styles.createButton}
                          onClick={() => handleMenuChange("publish")}
                        >
                          立即创建
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className={styles.profileWaterfallWrapper}>
                      <Waterfall
                        posts={profilePosts}
                        loading={isLoadingPosts}
                        onLoadMore={handleLoadMorePosts}
                      />
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: "likes",
              label: "喜欢",
              children: (
                <div className={styles.emptyContent}>
                  <div className={styles.emptyIcon}>
                    <img src="/images/empty-likes.png" alt="暂无喜欢" />
                  </div>
                  <p>还没有喜欢任何笔记</p>
                </div>
              ),
            },
            {
              key: "collections",
              label: "收藏",
              children: (
                <div className={styles.emptyContent}>
                  <div className={styles.emptyIcon}>
                    <img src="/images/empty-collections.png" alt="暂无收藏" />
                  </div>
                  <p>还没有收藏任何笔记</p>
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* 编辑资料弹窗 */}
      <EditProfileModal
        visible={isEditModalVisible}
        onCancel={handleCloseEditModal}
        userInfo={{
          avatar: userInfo.avatar,
          nickname: userInfo.nickname,
          username: userInfo.username,
          accountId: userInfo.accountId || userInfo.username,
          bio: userInfo.bio,
          gender: userInfo.gender,
          birthday: userInfo.birthday,
          location: userInfo.location,
          status: userInfo.status,
        }}
      />
    </div>
  );
};

export default ProfileContent;
