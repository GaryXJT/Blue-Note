import React, { useState, useEffect } from "react";
import { Tabs, Button, message } from "antd";
import {
  UserOutlined,
  EnvironmentOutlined,
  CheckOutlined,
  SmileOutlined,
  CoffeeOutlined,
  MehOutlined,
  RocketOutlined,
  FrownOutlined,
  ExclamationCircleOutlined,
  HeartOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  BulbOutlined,
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
  userInfo: initialUserInfo,
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

  // 添加本地状态来管理userInfo
  const [userInfo, setUserInfo] = useState(initialUserInfo);

  // 获取路由信息，用于提取 URL 中的 userId
  const router = useRouter();
  // 从查询参数中获取用户ID（支持新的profile查询参数形式）
  const userId = router.query.profile || router.query.id;

  // 判断是否是当前登录用户的资料页
  const [isSelf, setIsSelf] = useState(false);
  // 添加加载状态，在确定是否为当前用户之前隐藏按钮
  const [isProfileLoading, setIsProfileLoading] = useState(true);

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
    if (!userId) {
      return;
    }

    // 立即判断是否为当前用户（这不需要等待API）
    if (isLoggedIn && currentUser?.userId) {
      setIsSelf(userId === currentUser.userId);
    } else {
      setIsSelf(false);
    }
  }, [isLoggedIn, currentUser?.userId, userId]);

  // 根据URL中的userId获取用户完整资料
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) return;

      setIsProfileLoading(true);
      try {
        const response = await profileAPI.getUserProfile(userId as string);
        const profileData = (response.data as any)?.data;

        if (profileData) {
          // 如果是自己的资料，更新zustand store
          if (isSelf && isLoggedIn) {
            useAuthStore.getState().updateUser(profileData);
          }

          // 更新本地userInfo状态
          setUserInfo((prevUserInfo) => ({
            ...prevUserInfo,
            avatar: profileData.avatar || prevUserInfo.avatar,
            nickname: profileData.nickname || prevUserInfo.nickname,
            username: profileData.username || prevUserInfo.username,
            accountId: profileData.userId || prevUserInfo.accountId,
            bio: profileData.bio || prevUserInfo.bio,
            gender: profileData.gender || prevUserInfo.gender,
            birthday: profileData.birthday || prevUserInfo.birthday,
            location: profileData.location || prevUserInfo.location,
            status: profileData.status || prevUserInfo.status,
            followCount: profileData.followCount || prevUserInfo.followCount,
            fansCount: profileData.fansCount || prevUserInfo.fansCount,
            likeCount: profileData.likeCount || prevUserInfo.likeCount,
            collectCount: profileData.collectCount || prevUserInfo.collectCount,
            postCount: profileData.postCount || prevUserInfo.postCount,
          }));
        }
      } catch (error) {
        console.error("获取用户资料失败:", error);
      } finally {
        // 完成加载，显示适当的按钮
        setIsProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId, isSelf, isLoggedIn]);

  // 检查是否已关注该用户
  useEffect(() => {
    // 如果是自己的资料，不需要检查关注状态
    if (isSelf) return;

    // 如果未登录，不需要检查关注状态
    if (!isLoggedIn) return;

    // 如果没有用户ID，不需要检查
    if (!userId) return;

    // 从API获取关注状态
    const checkFollowStatus = async () => {
      try {
        setIsLoadingFollow(true);
        const response = await profileAPI.checkFollowStatus(userId as string);
        const isFollowing = (response.data as any)?.data?.isFollowing || false;
        setIsFollowing(isFollowing);
      } catch (error) {
        console.error("Failed to check follow status:", error);
      } finally {
        setIsLoadingFollow(false);
      }
    };

    checkFollowStatus();
  }, [isSelf, isLoggedIn, userId]);

  // 处理关注/取消关注
  const handleFollowToggle = async () => {
    // 如果未登录，显示提示信息
    if (!isLoggedIn) {
      message.info("请先登录后再关注");
      return;
    }

    if (!userId) {
      message.error("用户ID不存在");
      return;
    }

    setIsLoadingFollow(true);
    try {
      if (isFollowing) {
        // 取消关注
        await profileAPI.unfollowUser(userId as string);
        message.success("已取消关注");
      } else {
        // 关注
        await profileAPI.followUser(userId as string);
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

  // 刷新用户资料
  const refreshUserProfile = async () => {
    if (!userId) return;

    // 设置加载状态，可以展示一个小的loading效果
    setIsProfileLoading(true);

    try {
      const response = await profileAPI.getUserProfile(userId as string);
      const profileData = (response.data as any)?.data;

      if (profileData) {
        // 处理头像URL，添加时间戳以避免缓存问题
        if (profileData.avatar) {
          profileData.avatar = `${profileData.avatar}${
            profileData.avatar.includes("?") ? "&" : "?"
          }t=${new Date().getTime()}`;
        }

        // 如果是自己的资料，更新zustand store
        if (isSelf && isLoggedIn) {
          useAuthStore.getState().updateUser(profileData);
        }

        // 更新本地userInfo状态
        setUserInfo((prevUserInfo) => ({
          ...prevUserInfo,
          avatar: profileData.avatar || prevUserInfo.avatar,
          nickname: profileData.nickname || prevUserInfo.nickname,
          username: profileData.username || prevUserInfo.username,
          accountId: profileData.userId || prevUserInfo.accountId,
          bio: profileData.bio || prevUserInfo.bio,
          gender: profileData.gender || prevUserInfo.gender,
          birthday: profileData.birthday || prevUserInfo.birthday,
          location: profileData.location || prevUserInfo.location,
          status: profileData.status || prevUserInfo.status,
          followCount: profileData.followCount || prevUserInfo.followCount,
          fansCount: profileData.fansCount || prevUserInfo.fansCount,
          likeCount: profileData.likeCount || prevUserInfo.likeCount,
          collectCount: profileData.collectCount || prevUserInfo.collectCount,
          postCount: profileData.postCount || prevUserInfo.postCount,
        }));
      }
    } catch (error) {
      console.error("刷新用户资料失败:", error);
      // 可选：显示错误提示
      message.error("刷新资料失败，请稍后再试");
    } finally {
      // 无论成功还是失败，都结束加载状态
      setIsProfileLoading(false);
    }
  };

  // 根据状态码获取中文状态文本
  const getStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      happy: "开心",
      relaxed: "慵懒",
      bored: "无聊",
      excited: "兴奋",
      sad: "难过",
      anxious: "焦虑",
      peaceful: "平静",
      energetic: "甲亢",
      tired: "疲惫",
      thinking: "沉思",
    };

    return statusMap[status] || status;
  };

  // 计算年龄
  const calculateAge = (birthday?: string): number | null => {
    if (!birthday) return null;

    const birthDate = new Date(birthday);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // 如果还没过生日，年龄减1
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age >= 0 ? age : null; // 避免显示负数年龄
  };

  return (
    <div className={styles.container}>
      {/* 用户信息部分 */}
      <div className={styles.userProfileCard}>
        <div className={styles.userProfileContent}>
          <div className={styles.avatarContainer}>
            <img
              src={`${userInfo.avatar || "/images/default-avatar.png"}${
                userInfo.avatar?.includes("?") ? "&" : "?"
              }v=${new Date().getTime()}`}
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

            <div className={styles.bio}>{userInfo.bio}</div>

            <div className={styles.location}>
              {(userInfo.gender ||
                (userInfo.birthday &&
                  calculateAge(userInfo.birthday) !== null)) && (
                <span
                  className={`${styles.tagItem} ${styles.genderAgeTag} ${
                    userInfo.gender === "male"
                      ? styles.maleTag
                      : userInfo.gender === "female"
                      ? styles.femaleTag
                      : styles.otherTag
                  }`}
                  title="性别和年龄"
                >
                  {userInfo.gender === "male" ? (
                    <span>♂</span>
                  ) : userInfo.gender === "female" ? (
                    <span>♀</span>
                  ) : userInfo.gender ? (
                    <span>⚧</span>
                  ) : null}

                  {userInfo.birthday &&
                    calculateAge(userInfo.birthday) !== null && (
                      <span className={styles.ageText}>
                        {" "}
                        {calculateAge(userInfo.birthday)}岁
                      </span>
                    )}
                </span>
              )}

              {userInfo.location && (
                <span className={styles.tagItem} title="所在地区">
                  <EnvironmentOutlined />
                  <span>{userInfo.location}</span>
                </span>
              )}

              {userInfo.status && (
                <span
                  className={`${styles.tagItem} ${styles.statusTag} ${
                    styles[`status-${userInfo.status}`]
                  } ${userInfo.status ? styles.hasStatus : ""}`}
                  title={getStatusText(userInfo.status)}
                >
                  {userInfo.status === "happy" && <SmileOutlined />}
                  {userInfo.status === "relaxed" && <CoffeeOutlined />}
                  {userInfo.status === "bored" && <MehOutlined />}
                  {userInfo.status === "excited" && <RocketOutlined />}
                  {userInfo.status === "sad" && <FrownOutlined />}
                  {userInfo.status === "anxious" && (
                    <ExclamationCircleOutlined />
                  )}
                  {userInfo.status === "peaceful" && <HeartOutlined />}
                  {userInfo.status === "energetic" && <ThunderboltOutlined />}
                  {userInfo.status === "tired" && <ClockCircleOutlined />}
                  {userInfo.status === "thinking" && <BulbOutlined />}
                </span>
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
            {isProfileLoading ? (
              <div className={styles.buttonPlaceholder}></div>
            ) : isSelf ? (
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
            {
              key: "likes",
              label: "点赞",
              children: (
                <div className={styles.emptyContent}>
                  <div className={styles.emptyIcon}>
                    <img src="/images/empty-likes.png" alt="暂无点赞" />
                  </div>
                  <p>还没有点赞任何笔记</p>
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
        refreshUserProfile={refreshUserProfile}
      />
    </div>
  );
};

export default ProfileContent;
