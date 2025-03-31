import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import {
  Upload,
  message,
  Button,
  Table,
  Input,
  Space,
  Image,
  Tag,
  Tooltip,
  Popconfirm,
  Modal,
  Tabs,
  Spin,
} from "antd";
import {
  InboxOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  BellOutlined,
  HeartOutlined,
  UserAddOutlined,
  NotificationOutlined,
} from "@ant-design/icons";
import type { UploadFile, UploadProps } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Post } from "@/types"; // 从 @/types 中导入 Post 类型
import {
  getPosts,
  deletePost,
  getDrafts,
  deleteDraft,
  getPostDetail,
  getDraftDetail,
} from "@/api/services/posts"; // 导入API函数
import type { MenuType } from "@/types"; // 导入MenuType类型
import PostHeader from "@/components/post/PostHeader";
import PublishPage from "@/components/publish/PublishPage";
import PublishVideoPage from "@/components/publish/PublishVideoPage";
import SideMenu from "@/components/post/SideMenu";
import Waterfall from "@/components/layout/Waterfall";
import styles from "./Post.module.scss";
import PostModal from "@/components/post/PostModal";
import { formatDateTime } from "@/utils/date-formatter";

// 处理Post类型到PostItem的映射
interface PostItem extends Post {}

// 添加用户关注/粉丝数据模型
interface UserFollowItem {
  id: string;
  avatar: string;
  nickname: string;
  description: string;
  isFollowing: boolean;
}

// 定义通知类型
interface Notification {
  id: string;
  type: "like" | "follow" | "system";
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  postId?: string;
  postTitle?: string;
  postCover?: string;
  createdAt: string;
  isRead: boolean;
}

const Post: React.FC = () => {
  const router = useRouter();
  const { type } = router.query;

  // 从 URL 参数获取当前菜单类型，默认为 'publish'
  const [activeMenu, setActiveMenu] = useState<MenuType>("publish");
  const [activeTab, setActiveTab] = useState<"video" | "image">("image");
  const [isEditing, setIsEditing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [activeWorksTab, setActiveWorksTab] = useState<
    "all" | "published" | "reviewing" | "rejected"
  >("all");
  const [activeProfileTab, setActiveProfileTab] = useState<
    "all" | "stats" | "followers"
  >("all");

  // 添加Modal相关状态
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<PostItem | null>(null);

  // 添加搜索关键词状态
  const [searchText, setSearchText] = useState("");
  const [searchDraftText, setSearchDraftText] = useState("");

  // 添加关注/粉丝状态
  const [followTab, setFollowTab] = useState<"following" | "followers">(
    "following"
  );

  // 添加瀑布流相关状态
  const [profilePosts, setProfilePosts] = useState<PostItem[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [profilePostsPage, setProfilePostsPage] = useState(1);
  const [userHasNoPosts, setUserHasNoPosts] = useState(false);

  // 添加通知相关状态
  const [activeNotificationTab, setActiveNotificationTab] = useState<
    "like" | "follow" | "system"
  >("like");
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // API数据状态
  const [postsData, setPostsData] = useState<Post[]>([]);
  const [draftsData, setDraftsData] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalDrafts, setTotalDrafts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [currentDraftPage, setCurrentDraftPage] = useState(1);
  const [draftPageSize, setDraftPageSize] = useState(10);

  // 在组件开始的useState部分添加新的状态变量
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [editRecord, setEditRecord] = useState<any | null>(null);
  const [editModalLoading, setEditModalLoading] = useState<boolean>(false);

  // 获取笔记列表
  const fetchPosts = useCallback(
    async (page = 1, limit = 10) => {
      try {
        setLoading(true);
        const status = activeWorksTab !== "all" ? activeWorksTab : undefined;
        const res = await getPosts({
          page,
          limit,
          status,
        });

        // 根据API文档中的响应结构处理数据
        if (res) {
          console.log("API响应数据:", res);
          // API返回格式: res.data(ApiResponse) -> data(内部数据) -> data.list, data.total
          const apiResponse = res.data;
          if (apiResponse && apiResponse.data) {
            const apiData = apiResponse.data;
            if (apiData.list) {
              const formattedPosts = apiData.list.map((post: any) => ({
                id:
                  post.postId ||
                  post.id ||
                  `post-${Date.now()}-${Math.random()
                    .toString(36)
                    .substr(2, 9)}`,
                title: post.title,
                content: post.content || "",
                coverUrl: post.coverImage,
                type: post.type || "image",
                author: post.user
                  ? {
                      id: post.user.userId,
                      name: post.user.nickname || "未知用户",
                      avatar: post.user.avatar || "/images/default-avatar.png",
                    }
                  : undefined,
                userId: post.userId,
                username: post.username || "",
                nickname:
                  post.nickname || (post.user ? post.user.nickname : "") || "",
                likes: post.likes || post.likeCount || 0,
                comments: post.comments || post.commentCount || 0,
                status: "published", // 默认已发布状态
                createdAt: post.createdAt,
                updatedAt: post.updatedAt || post.createdAt,
                files: post.files || [],
              })) as Post[];
              setPostsData(formattedPosts);
              setTotalPosts(apiData.total || 0);
              console.log("格式化后的笔记数据:", formattedPosts);
            } else {
              console.error("API返回的数据格式不符合预期:", apiResponse);
              message.error("获取数据格式异常");
            }
          } else {
            console.error("API返回的数据格式不符合预期:", res.data);
            message.error("获取数据格式异常");
          }
        }
      } catch (error) {
        console.error("获取笔记列表失败:", error);
        message.error("获取笔记列表失败");
      } finally {
        setLoading(false);
      }
    },
    [activeWorksTab]
  );

  // 获取草稿列表
  const fetchDrafts = useCallback(async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const res = await getDrafts({
        page,
        limit,
      });

      // 根据API文档中的响应结构处理数据
      if (res) {
        console.log("草稿API响应数据:", res);
        // API返回格式: res.data(ApiResponse) -> data(内部数据) -> data.list, data.total
        const apiResponse = res.data;
        if (apiResponse && apiResponse.data) {
          const apiData = apiResponse.data;
          if (apiData.list) {
            const formattedDrafts = apiData.list.map((draft: any) => ({
              id:
                draft.postId ||
                draft.id ||
                `draft-${Date.now()}-${Math.random()
                  .toString(36)
                  .substr(2, 9)}`,
              title: draft.title,
              content: draft.content || "",
              coverUrl: draft.coverImage,
              type: draft.type || "image",
              author: draft.user
                ? {
                    id: draft.user.userId,
                    name: draft.user.nickname || "未知用户",
                    avatar: draft.user.avatar || "/images/default-avatar.png",
                  }
                : undefined,
              userId: draft.userId,
              username: draft.username || "",
              nickname:
                draft.nickname || (draft.user ? draft.user.nickname : "") || "",
              likes: draft.likes || draft.likeCount || 0,
              comments: draft.comments || draft.commentCount || 0,
              status: "draft",
              createdAt: draft.createdAt,
              updatedAt: draft.updatedAt || draft.createdAt,
              files: draft.files || [],
            })) as Post[];
            setDraftsData(formattedDrafts);
            setTotalDrafts(apiData.total || 0);
            console.log("格式化后的草稿数据:", formattedDrafts);
          } else {
            console.error("草稿API返回的数据格式不符合预期:", apiResponse);
            message.error("获取草稿数据格式异常");
          }
        } else {
          console.error("草稿API返回的数据格式不符合预期:", res.data);
          message.error("获取草稿数据格式异常");
        }
      }
    } catch (error) {
      console.error("获取草稿列表失败:", error);
      message.error("获取草稿列表失败");
    } finally {
      setLoading(false);
    }
  }, []);

  // 当路由变化时，更新活动菜单
  useEffect(() => {
    if (type && typeof type === "string") {
      const validMenus: MenuType[] = [
        "publish",
        "drafts",
        "works",
        "profile",
        "notifications",
      ];
      if (validMenus.includes(type as MenuType)) {
        setActiveMenu(type as MenuType);
      } else {
        // 如果是无效的菜单类型，重定向到 /post/publish
        router.replace("/post/publish");
      }
    }
  }, [type, router]);

  // 当菜单或筛选条件变化时，获取数据
  useEffect(() => {
    if (activeMenu === "works") {
      fetchPosts(currentPage, pageSize);
    } else if (activeMenu === "drafts") {
      fetchDrafts(currentDraftPage, draftPageSize);
    }
  }, [
    activeMenu,
    activeWorksTab,
    currentPage,
    pageSize,
    currentDraftPage,
    draftPageSize,
    fetchPosts,
    fetchDrafts,
  ]);

  // 当发布完成时回到列表页面
  const handlePublishComplete = () => {
    setIsEditing(false);
    setUploadedFiles([]);
    setUploadedVideo(null);
    setFileList([]);
    // 切换到作品列表
    handleMenuChange("works");
    // 重新加载数据
    fetchPosts(1, pageSize);
  };

  // 当菜单变化时更新 URL
  const handleMenuChange = (menu: MenuType) => {
    setActiveMenu(menu);
    // 如果正在编辑模式，退出编辑模式
    if (isEditing && menu !== "publish") {
      setIsEditing(false);
    }
  };

  // 编辑笔记
  const handleEdit = async (id: string) => {
    try {
      setEditModalLoading(true);
      // 根据帖子类型获取详细数据
      let postDetail = null;

      if (activeMenu === "works") {
        // 获取帖子详情
        const response = await getPostDetail(id);
        if (response && response.data && response.data.data) {
          postDetail = response.data.data;
        }
      } else if (activeMenu === "drafts") {
        // 获取草稿详情
        const response = await getDraftDetail(id);
        if (response && response.data && response.data.data) {
          postDetail = response.data.data;
        }
      }

      if (postDetail) {
        console.log("获取到的帖子详情:", postDetail);
        setEditRecord(postDetail);
        setEditModalVisible(true);
      } else {
        message.error("获取帖子详情失败，请重试");
      }
    } catch (error) {
      console.error("获取帖子详情失败:", error);
      message.error("获取帖子详情失败，请重试");
    } finally {
      setEditModalLoading(false);
    }
  };

  // 删除笔记
  const handleDelete = async (id: string) => {
    try {
      if (activeMenu === "works") {
        setLoading(true);
        await deletePost(id);
        message.success("笔记已删除");
        // 重新加载列表
        fetchPosts(currentPage, pageSize);
      } else if (activeMenu === "drafts") {
        setLoading(true);
        await deleteDraft(id);
        message.success("草稿已删除");
        // 重新加载列表
        fetchDrafts(currentDraftPage, draftPageSize);
      }
    } catch (error) {
      console.error("删除失败:", error);
      message.error("删除失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  // 搜索笔记（笔记管理）
  const handleSearch = (value: string) => {
    setSearchText(value);
    setCurrentPage(1); // 重置页码
    // 此处可以添加搜索相关的API调用
  };

  // 搜索草稿
  const handleDraftSearch = (value: string) => {
    setSearchDraftText(value);
    setCurrentDraftPage(1); // 重置页码
    // 此处可以添加搜索相关的API调用
  };

  // 过滤笔记数据（本地过滤，如果API支持搜索，应该改为API调用）
  const filteredPosts = postsData.filter((post) => {
    // 根据搜索关键词过滤
    if (
      searchText &&
      !(
        post.title?.toLowerCase().includes(searchText.toLowerCase()) ||
        post.content?.toLowerCase().includes(searchText.toLowerCase()) ||
        post.id?.toLowerCase().includes(searchText.toLowerCase())
      )
    ) {
      return false;
    }

    return true;
  });

  // 过滤草稿数据（本地过滤，如果API支持搜索，应该改为API调用）
  const filteredDrafts = draftsData.filter(
    (draft) =>
      !searchDraftText ||
      draft.title?.toLowerCase().includes(searchDraftText.toLowerCase()) ||
      draft.content?.toLowerCase().includes(searchDraftText.toLowerCase()) ||
      draft.id?.toLowerCase().includes(searchDraftText.toLowerCase())
  );

  // 分页变化处理
  const handlePageChange = (page: number, pageSize?: number) => {
    setCurrentPage(page);
    if (pageSize) setPageSize(pageSize);
  };

  // 草稿分页变化处理
  const handleDraftPageChange = (page: number, pageSize?: number) => {
    setCurrentDraftPage(page);
    if (pageSize) setDraftPageSize(pageSize);
  };

  // 定义笔记表格列
  const postColumns: ColumnsType<Post> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 120,
    },
    {
      title: "封面",
      dataIndex: "coverUrl",
      key: "cover",
      width: 120,
      render: (coverUrl: string) => (
        <Image
          src={coverUrl || "/images/default-cover.png"}
          alt="帖子封面"
          width={80}
          height={80}
          style={{ objectFit: "cover" }}
          className={styles.postCover}
        />
      ),
    },
    {
      title: "标题",
      dataIndex: "title",
      key: "title",
      width: 200,
    },
    {
      title: "内容",
      dataIndex: "content",
      key: "content",
      ellipsis: {
        showTitle: false,
      },
      render: (content: string) => (
        <Tooltip placement="topLeft" title={content}>
          {content}
        </Tooltip>
      ),
    },
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
      width: 100,
      render: (type: string) => (
        <Tag color={type === "video" ? "blue" : "green"}>
          {type === "video" ? "视频" : "图文"}
        </Tag>
      ),
    },
    {
      title: "发布时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (createdAt: string) => formatDateTime(createdAt),
    },
    {
      title: "更新时间",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 180,
      render: (updatedAt: string) => formatDateTime(updatedAt),
    },
    {
      title: "操作",
      key: "action",
      width: 120,
      render: (_: any, record: Post) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record.id)}
          />
          <Popconfirm
            title="确定要删除这篇笔记吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 定义草稿表格列
  const draftColumns: ColumnsType<Post> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 120,
    },
    {
      title: "封面",
      dataIndex: "coverUrl",
      key: "cover",
      width: 120,
      render: (coverUrl: string) => (
        <Image
          src={coverUrl || "/images/default-cover.png"}
          alt="草稿封面"
          width={80}
          height={80}
          style={{ objectFit: "cover" }}
          className={styles.postCover}
        />
      ),
    },
    {
      title: "标题",
      dataIndex: "title",
      key: "title",
      width: 200,
    },
    {
      title: "内容",
      dataIndex: "content",
      key: "content",
      ellipsis: {
        showTitle: false,
      },
      render: (content: string) => (
        <Tooltip placement="topLeft" title={content}>
          {content}
        </Tooltip>
      ),
    },
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
      width: 100,
      render: (type: string) => (
        <Tag color={type === "video" ? "blue" : "green"}>
          {type === "video" ? "视频" : "图文"}
        </Tag>
      ),
    },
    {
      title: "保存时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (createdAt: string) => formatDateTime(createdAt),
    },
    {
      title: "更新时间",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 180,
      render: (updatedAt: string) => formatDateTime(updatedAt),
    },
    {
      title: "操作",
      key: "action",
      width: 120,
      render: (_: any, record: Post) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record.id)}
          />
          <Popconfirm
            title="确定要删除这篇草稿吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 打开PostModal弹窗
  const handleOpenPostModal = (record: Post) => {
    // 将Post转换为PostItem格式
    const postItem: PostItem = {
      ...record,
      // 确保必填字段存在
      author: record.author || {
        id: record.userId || "",
        name: record.username || record.nickname || "未知用户",
        avatar: "/images/default-avatar.png",
      },
      likes: record.likes || 0,
      type: record.type || "image",
    };

    setSelectedPost(postItem);
    setIsModalVisible(true);
  };

  // 关闭PostModal弹窗
  const handleClosePostModal = () => {
    setIsModalVisible(false);
    setSelectedPost(null);
  };

  // 渲染右侧内容
  const renderContent = () => {
    switch (activeMenu) {
      case "publish":
        if (isEditing) {
          if (activeTab === "video" && uploadedVideo) {
            return (
              <PublishVideoPage
                initialVideo={uploadedVideo}
                onBack={() => {
                  setIsEditing(false);
                  setUploadedVideo(null);
                }}
                onPublish={handlePublishComplete}
              />
            );
          } else if (activeTab === "image") {
            return (
              <PublishPage
                initialImages={uploadedFiles}
                onBack={() => {
                  setIsEditing(false);
                  setUploadedFiles([]);
                  setFileList([]);
                }}
                onPublish={handlePublishComplete}
              />
            );
          }
        } else {
          return (
            <div className={styles.container}>
              <div className={styles.header}>
                <h1>发布笔记</h1>
              </div>
              <div className={styles.content}>
                <div className={styles.tabs}>
                  <button
                    className={`${styles.tab} ${
                      activeTab === "video" ? styles.active : ""
                    }`}
                    onClick={() => setActiveTab("video")}
                  >
                    上传视频
                  </button>
                  <button
                    className={`${styles.tab} ${
                      activeTab === "image" ? styles.active : ""
                    }`}
                    onClick={() => setActiveTab("image")}
                  >
                    上传图文
                  </button>
                </div>

                {activeTab === "image" && (
                  <Upload.Dragger
                    name="files"
                    fileList={fileList}
                    onChange={handleUploadChange}
                    beforeUpload={beforeUpload}
                    multiple={true}
                    accept="image/*"
                    showUploadList={false}
                    className={styles.uploadArea}
                  >
                    <div className={styles.uploadContent}>
                      <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                      </p>
                      <div className={styles.uploadText}>
                        <p>建议上传720P（1280*720）及以上画质图片</p>
                        <p>超过1080P的图片将自动压缩上传</p>
                      </div>
                      <div className={styles.uploadButton}>上传图片</div>
                    </div>
                  </Upload.Dragger>
                )}
                {activeTab === "video" && (
                  <Upload.Dragger
                    name="file"
                    onChange={handleUploadChange}
                    beforeUpload={beforeUpload}
                    multiple={false}
                    accept="video/*"
                    showUploadList={false}
                    className={styles.uploadArea}
                  >
                    <div className={styles.uploadContent}>
                      <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                      </p>
                      <div className={styles.uploadText}>
                        <p>支持mp4、mov等常见格式</p>
                        <p>单个视频不超过100MB</p>
                      </div>
                      <div className={styles.uploadButton}>上传视频</div>
                    </div>
                  </Upload.Dragger>
                )}
              </div>
            </div>
          );
        }
        break;

      case "drafts":
        return (
          <div className={styles.container}>
            <div className={styles.header}>
              <h1>草稿箱</h1>
              <Input.Search
                placeholder="搜索草稿"
                allowClear
                enterButton={<SearchOutlined />}
                onSearch={handleDraftSearch}
                style={{ width: 300 }}
              />
            </div>
            <div className={styles.tableContainer}>
              <Table
                columns={draftColumns}
                dataSource={filteredDrafts}
                rowKey="id"
                pagination={{
                  current: currentDraftPage,
                  pageSize: draftPageSize,
                  total: totalDrafts,
                  onChange: handleDraftPageChange,
                }}
                onRow={(record) => ({
                  onClick: (e) => {
                    // 如果点击的是操作按钮，不触发弹窗
                    if (
                      (e.target as HTMLElement).closest(".ant-btn") ||
                      (e.target as HTMLElement).closest(".ant-popover-open")
                    ) {
                      return;
                    }
                    handleOpenPostModal(record);
                  },
                })}
                className={styles.clickableTable}
                loading={loading}
              />
            </div>

            {/* 添加PostModal组件 */}
            {selectedPost && (
              <PostModal
                post={selectedPost}
                isOpen={isModalVisible}
                onClose={handleClosePostModal}
              />
            )}
          </div>
        );

      case "works":
        const handleWorksTabChange = (
          tab: "all" | "published" | "reviewing" | "rejected"
        ) => {
          setActiveWorksTab(tab);
          setCurrentPage(1); // 重置页码

          // 如果不是"全部笔记"标签，暂不加载数据
          if (tab !== "all") {
            // 仅设置状态，不调用接口
            console.log(`选择了${tab}标签，该功能开发中...`);
          }
        };

        return (
          <div className={styles.container}>
            <div className={styles.header}>
              <h1>笔记管理</h1>
              <Input.Search
                placeholder="搜索已发布笔记"
                allowClear
                enterButton={<SearchOutlined />}
                onSearch={handleSearch}
                style={{ width: 300 }}
              />
            </div>
            <div className={styles.worksTabs}>
              <div className={styles.tabsNav}>
                <div
                  className={`${styles.tabItem} ${
                    activeWorksTab === "all" ? styles.active : ""
                  }`}
                  onClick={() => handleWorksTabChange("all")}
                >
                  全部笔记({totalPosts})
                </div>
                <div
                  className={`${styles.tabItem} ${
                    activeWorksTab === "published" ? styles.active : ""
                  }`}
                  onClick={() => handleWorksTabChange("published")}
                >
                  已发布
                </div>
                <div
                  className={`${styles.tabItem} ${
                    activeWorksTab === "reviewing" ? styles.active : ""
                  }`}
                  onClick={() => handleWorksTabChange("reviewing")}
                >
                  审核中
                </div>
                <div
                  className={`${styles.tabItem} ${
                    activeWorksTab === "rejected" ? styles.active : ""
                  }`}
                  onClick={() => handleWorksTabChange("rejected")}
                >
                  未通过
                </div>
              </div>
            </div>

            <div className={styles.tableContainer}>
              {activeWorksTab !== "all" ? (
                // 如果不是"全部"标签，显示开发中提示
                <div className={styles.emptyContent}>
                  <p>该功能正在开发中，敬请期待</p>
                  <div className={styles.tipText}>
                    您可以在"全部笔记"标签下查看和管理所有笔记
                  </div>
                </div>
              ) : filteredPosts.length > 0 ? (
                // 全部笔记且有数据时显示表格
                <Table
                  columns={postColumns}
                  dataSource={filteredPosts}
                  rowKey="id"
                  pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: totalPosts,
                    onChange: handlePageChange,
                  }}
                  onRow={(record) => ({
                    onClick: (e) => {
                      // 如果点击的是操作按钮，不触发弹窗
                      if (
                        (e.target as HTMLElement).closest(".ant-btn") ||
                        (e.target as HTMLElement).closest(".ant-popover-open")
                      ) {
                        return;
                      }
                      handleOpenPostModal(record);
                    },
                  })}
                  className={styles.clickableTable}
                  loading={loading}
                />
              ) : (
                // 全部笔记但没有数据时显示空状态
                <div className={styles.emptyContent}>
                  <div className={styles.emptyIcon}>
                    <img src="/images/empty-works.png" alt="暂无笔记" />
                  </div>
                  <p>没有找到相关笔记</p>
                </div>
              )}
            </div>

            {/* 添加PostModal组件 */}
            {selectedPost && (
              <PostModal
                post={selectedPost}
                isOpen={isModalVisible}
                onClose={handleClosePostModal}
              />
            )}
          </div>
        );

      case "notifications":
        return (
          <div className={styles.notificationsContainer}>
            <div className={styles.pageHeader}>
              <h1>通知中心</h1>
            </div>

            <div className={styles.notificationTabs}>
              <Tabs
                activeKey={activeNotificationTab}
                onChange={(key) =>
                  handleNotificationTabChange(
                    key as "like" | "follow" | "system"
                  )
                }
                items={[
                  {
                    key: "like",
                    label: (
                      <span>
                        <HeartOutlined />
                        点赞
                      </span>
                    ),
                  },
                  {
                    key: "follow",
                    label: (
                      <span>
                        <UserAddOutlined />
                        关注
                      </span>
                    ),
                  },
                  {
                    key: "system",
                    label: (
                      <span>
                        <NotificationOutlined />
                        其他
                      </span>
                    ),
                  },
                ]}
              />
            </div>

            <div className={styles.notificationContent}>
              {renderNotificationsContent()}
            </div>
          </div>
        );

      default:
        return <div>无效的菜单选项</div>;
    }
  };

  // 处理通知标签页切换
  const handleNotificationTabChange = (tab: "like" | "follow" | "system") => {
    setActiveNotificationTab(tab);
  };

  // 处理文件上传
  const handleUploadChange: UploadProps["onChange"] = ({
    fileList: newFileList,
    file,
  }) => {
    // 注意：当用户在拖拽区域或点击上传选择文件时，Upload组件会调用beforeUpload
    // 在beforeUpload中我们已经处理了状态更新，这里主要处理用户从上传列表中删除文件的情况

    if (activeTab === "image") {
      // 如果是删除操作（文件列表变少了）
      if (newFileList.length < fileList.length) {
        setFileList(newFileList);
        // 提取所有保留的文件
        const remainingFiles = newFileList
          .filter((f) => f.originFileObj)
          .map((f) => f.originFileObj as File);

        setUploadedFiles(remainingFiles);

        // 如果没有文件了，退出编辑模式
        if (remainingFiles.length === 0) {
          setIsEditing(false);
        }
      }
    } else if (activeTab === "video") {
      // 视频处理：如果用户删除了视频
      if (newFileList.length === 0 && fileList.length > 0) {
        setFileList([]);
        setUploadedVideo(null);
        setIsEditing(false);
      }
    }
  };

  // 自定义上传前检查
  const beforeUpload = (file: File) => {
    if (activeTab === "video") {
      console.log("检查视频文件:", file.name, file.type, file.size);

      const isVideo = file.type.startsWith("video/");
      if (!isVideo) {
        message.error("只能上传视频文件！");
        return false;
      }

      // 检查视频大小
      const isSizeValid = file.size / 1024 / 1024 < 100; // 小于100MB
      if (!isSizeValid) {
        message.error("视频必须小于100MB！");
        return false;
      }

      try {
        // 视频只允许上传一个
        setUploadedVideo(file);
        console.log("设置视频文件成功:", file.name);

        // 创建一个新的UploadFile对象并更新fileList
        const newFile: UploadFile = {
          uid: `-${Date.now()}`, // 使用时间戳确保每个文件都有唯一的uid
          name: file.name,
          status: "done",
          url: URL.createObjectURL(file),
          originFileObj: file as any,
        };
        setFileList([newFile]); // 视频只允许一个
        console.log("视频文件准备就绪，进入编辑模式");
        setIsEditing(true);
      } catch (error) {
        console.error("处理视频文件时出错:", error);
        message.error("处理视频文件失败，请重试");
        return false;
      }
    } else if (activeTab === "image") {
      const isImage = file.type.startsWith("image/");
      if (!isImage) {
        message.error("只能上传图片文件！");
        return false;
      }

      // 检查图片大小
      const isSizeValid = file.size / 1024 / 1024 < 10; // 小于10MB
      if (!isSizeValid) {
        message.error("图片必须小于10MB！");
        return false;
      }

      // 创建一个新的带有唯一ID的UploadFile对象
      const newFile: UploadFile = {
        uid: `-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // 确保绝对唯一
        name: file.name,
        status: "done",
        url: URL.createObjectURL(file),
        originFileObj: file as any,
      };

      // 添加图片到uploadedFiles数组
      setUploadedFiles((prevFiles) => [...prevFiles, file]);

      // 添加新图片到fileList
      setFileList((prevFileList) => [...prevFileList, newFile]);

      // 确保设置编辑模式
      setIsEditing(true);
    }

    // 返回 false 以使用自定义上传逻辑，而不是自动上传
    return false;
  };

  // 渲染通知内容
  const renderNotificationsContent = () => {
    const filteredNotifications = notifications.filter(
      (notification) => notification.type === activeNotificationTab
    );

    if (filteredNotifications.length === 0) {
      return (
        <div className={styles.emptyContent}>
          <div className={styles.emptyIcon}>
            <BellOutlined />
          </div>
          <div className={styles.emptyText}>
            暂无
            {activeNotificationTab === "like"
              ? "点赞"
              : activeNotificationTab === "follow"
              ? "关注"
              : "系统"}
            通知
          </div>
        </div>
      );
    }

    return (
      <div className={styles.notificationList}>
        {filteredNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`${styles.notificationItem} ${
              notification.isRead ? styles.read : ""
            }`}
          >
            {notification.type === "like" && (
              <div className={styles.likeNotification}>
                <div className={styles.senderAvatar}>
                  <img
                    src={notification.senderAvatar}
                    alt={notification.senderName}
                  />
                </div>
                <div className={styles.notificationInfo}>
                  <span className={styles.senderName}>
                    {notification.senderName}
                  </span>
                  <span className={styles.notificationContent}>
                    {notification.content}
                  </span>
                  <span className={styles.notificationTime}>
                    {notification.createdAt}
                  </span>
                </div>
                <div className={styles.postPreview}>
                  <div className={styles.postImage}>
                    <img
                      src={notification.postCover}
                      alt={notification.postTitle}
                    />
                  </div>
                  <div className={styles.postTitle}>
                    {notification.postTitle}
                  </div>
                </div>
              </div>
            )}

            {notification.type === "follow" && (
              <div className={styles.followNotification}>
                <div className={styles.senderAvatar}>
                  <img
                    src={notification.senderAvatar}
                    alt={notification.senderName}
                  />
                </div>
                <div className={styles.notificationInfo}>
                  <span className={styles.senderName}>
                    {notification.senderName}
                  </span>
                  <span className={styles.notificationContent}>
                    {notification.content}
                  </span>
                  <span className={styles.notificationTime}>
                    {notification.createdAt}
                  </span>
                </div>
              </div>
            )}

            {notification.type === "system" && (
              <div className={styles.systemNotification}>
                <div className={styles.notificationIcon}>
                  <NotificationOutlined />
                </div>
                <div className={styles.notificationInfo}>
                  <span className={styles.senderName}>
                    {notification.senderName}
                  </span>
                  <span className={styles.notificationContent}>
                    {notification.content}
                  </span>
                  <span className={styles.notificationTime}>
                    {notification.createdAt}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>
          {activeMenu === "publish"
            ? "发布笔记"
            : activeMenu === "drafts"
            ? "草稿箱"
            : activeMenu === "notifications"
            ? "通知中心"
            : "笔记管理"}{" "}
          - 小蓝书
        </title>
      </Head>
      <PostHeader />
      <div className={styles.layout}>
        <div className={styles.main}>
          <SideMenu activeMenu={activeMenu} onMenuChange={handleMenuChange} />
          {renderContent()}
        </div>
      </div>

      {/* 添加编辑模态框 */}
      <Modal
        title={editRecord?.type === "video" ? "编辑视频" : "编辑图文"}
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={1000}
        destroyOnClose
        maskClosable={false}
        style={{ top: 20 }}
        bodyStyle={{ padding: 0 }}
      >
        {editModalLoading ? (
          <div style={{ padding: 24, textAlign: "center" }}>
            <Spin tip="加载中..." />
          </div>
        ) : (
          editRecord && (
            <>
              {editRecord.type === "video" ? (
                <PublishVideoPage
                  onBack={() => setEditModalVisible(false)}
                  onPublish={handlePublishComplete}
                  editData={editRecord}
                />
              ) : (
                <PublishPage
                  initialImages={[]}
                  onBack={() => setEditModalVisible(false)}
                  onPublish={handlePublishComplete}
                  editData={editRecord}
                />
              )}
            </>
          )
        )}
      </Modal>
    </>
  );
};

export default Post;
