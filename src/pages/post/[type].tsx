import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
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
} from 'antd'
import {
  InboxOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  BellOutlined,
  HeartOutlined,
  UserAddOutlined,
  NotificationOutlined,
} from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Post } from '../../api/types' // 仅导入Post类型
import type { MenuType } from '../../types' // 导入MenuType类型
import PostHeader from '../../components/post/PostHeader'
import PublishPage from '../../components/publish/PublishPage'
import PublishVideoPage from '../../components/publish/PublishVideoPage'
import SideMenu from '../../components/post/SideMenu'
import Waterfall from '../../components/layout/Waterfall'
import styles from './Post.module.scss'
import PostModal from '../../components/post/PostModal'

// 定义笔记数据接口
interface PostData {
  id: string
  coverUrl: string
  title: string
  content: string
  createTime: string
  status?: 'published' | 'reviewing' | 'rejected'
  type: 'image' | 'video'
}

// 扩展为首页帖子数据的接口，与PostModal兼容
interface PostItem extends PostData {
  author: {
    // 非可选，必须存在
    id: string // 添加id属性
    name: string
    avatar: string
  }
  images?: string[]
  likes: number // 非可选，必须存在
  comments?: number
  saves?: number
  createdAt: string
  updatedAt: string
}

// 添加用户关注/粉丝数据模型
interface UserFollowItem {
  id: string
  avatar: string
  nickname: string
  description: string
  isFollowing: boolean
}

// 定义通知类型
interface Notification {
  id: string
  type: 'like' | 'follow' | 'system'
  senderId: string
  senderName: string
  senderAvatar?: string
  content: string
  postId?: string
  postTitle?: string
  postCover?: string
  createdAt: string
  isRead: boolean
}

const Post: React.FC = () => {
  const router = useRouter()
  const { type } = router.query

  // 从 URL 参数获取当前菜单类型，默认为 'publish'
  const [activeMenu, setActiveMenu] = useState<MenuType>('publish')
  const [activeTab, setActiveTab] = useState<'video' | 'image'>('image')
  const [isEditing, setIsEditing] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [activeWorksTab, setActiveWorksTab] = useState<
    'all' | 'published' | 'reviewing' | 'rejected'
  >('all')
  const [activeProfileTab, setActiveProfileTab] = useState<
    'all' | 'stats' | 'followers'
  >('all')

  // 添加Modal相关状态
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [selectedPost, setSelectedPost] = useState<PostItem | null>(null)

  // 添加搜索关键词状态
  const [searchText, setSearchText] = useState('')
  const [searchDraftText, setSearchDraftText] = useState('')

  // 添加关注/粉丝状态
  const [followTab, setFollowTab] = useState<'following' | 'followers'>(
    'following'
  )

  // 添加瀑布流相关状态
  const [profilePosts, setProfilePosts] = useState<Post[]>([])
  const [isLoadingPosts, setIsLoadingPosts] = useState(false)
  const [profilePostsPage, setProfilePostsPage] = useState(1)
  const [userHasNoPosts, setUserHasNoPosts] = useState(true)

  // 添加通知相关状态
  const [activeNotificationTab, setActiveNotificationTab] = useState<
    'like' | 'follow' | 'system'
  >('like')
  const [notifications, setNotifications] = useState<Notification[]>([
    // 点赞通知示例
    {
      id: 'n001',
      type: 'like',
      senderId: 'u001',
      senderName: '旅行摄影师',
      senderAvatar: 'https://via.placeholder.com/50',
      content: '赞了你的笔记',
      postId: 'POST00001',
      postTitle: '上海周末好去处',
      postCover: 'https://via.placeholder.com/100x100',
      createdAt: '2024-04-20 14:30',
      isRead: false,
    },
    {
      id: 'n002',
      type: 'like',
      senderId: 'u002',
      senderName: '美食达人',
      senderAvatar: 'https://via.placeholder.com/50',
      content: '赞了你的笔记',
      postId: 'POST00004',
      postTitle: '春季穿搭指南',
      postCover: 'https://via.placeholder.com/100x100',
      createdAt: '2024-04-19 10:15',
      isRead: true,
    },
    // 关注通知示例
    {
      id: 'n003',
      type: 'follow',
      senderId: 'u003',
      senderName: '摄影爱好者',
      senderAvatar: 'https://via.placeholder.com/50',
      content: '关注了你',
      createdAt: '2024-04-18 20:45',
      isRead: false,
    },
    {
      id: 'n004',
      type: 'follow',
      senderId: 'u004',
      senderName: '城市探索者',
      senderAvatar: 'https://via.placeholder.com/50',
      content: '关注了你',
      createdAt: '2024-04-17 09:30',
      isRead: true,
    },
    // 系统通知示例
    {
      id: 'n005',
      type: 'system',
      senderId: 'system',
      senderName: '系统通知',
      content: '您的帐号已完成年度审核，感谢您的配合。',
      createdAt: '2024-04-16 15:00',
      isRead: false,
    },
    {
      id: 'n006',
      type: 'system',
      senderId: 'system',
      senderName: '系统通知',
      content: '平台将于4月25日进行系统维护，预计维护时间2小时。',
      createdAt: '2024-04-15 11:20',
      isRead: true,
    },
  ])

  // 模拟关注/粉丝数据
  const [followingData, setFollowingData] = useState<UserFollowItem[]>([
    {
      id: '1001',
      avatar: 'https://via.placeholder.com/50',
      nickname: '旅行摄影师',
      description: '分享世界各地的风景与人文',
      isFollowing: true,
    },
    {
      id: '1002',
      avatar: 'https://via.placeholder.com/50',
      nickname: '美食达人',
      description: '探索各种美食，分享烹饪技巧',
      isFollowing: true,
    },
    {
      id: '1003',
      avatar: 'https://via.placeholder.com/50',
      nickname: '生活方式博主',
      description: '记录日常生活的点滴',
      isFollowing: true,
    },
  ])

  const [followersData, setFollowersData] = useState<UserFollowItem[]>([
    {
      id: '2001',
      avatar: 'https://via.placeholder.com/50',
      nickname: '摄影爱好者',
      description: '热爱拍照，记录美好瞬间',
      isFollowing: false,
    },
    {
      id: '2002',
      avatar: 'https://via.placeholder.com/50',
      nickname: '城市探索者',
      description: '发现城市中的隐藏宝藏',
      isFollowing: true,
    },
  ])

  // 模拟笔记数据
  const [postsData, setPostsData] = useState<PostData[]>([
    {
      id: 'POST00001',
      coverUrl: 'https://via.placeholder.com/100x100',
      title: '上海周末好去处',
      content:
        '周末来上海旅游的朋友们，这里有最全的景点攻略，包括必去的景点、美食和交通信息。上海是一个充满活力的城市，这里有很多值得游览的地方...',
      createTime: '2023-03-15 14:30',
      status: 'published',
      type: 'image',
    },
    {
      id: 'POST00002',
      coverUrl: 'https://via.placeholder.com/100x100',
      title: '最美旅行地点推荐',
      content:
        '想去旅行但不知道选择哪里？这篇攻略为您推荐十大最美旅行胜地，让您的假期更加难忘。从山水秀丽的桂林到人文荟萃的西安...',
      createTime: '2023-03-10 09:15',
      status: 'reviewing',
      type: 'image',
    },
    {
      id: 'POST00003',
      coverUrl: 'https://via.placeholder.com/100x100',
      title: '家常菜谱分享',
      content:
        '这是我最喜欢的几道家常菜谱，简单易学，适合厨房新手。材料也都很常见，不需要特别准备。其中包括番茄炒蛋、麻婆豆腐...',
      createTime: '2023-03-05 18:45',
      status: 'rejected',
      type: 'image',
    },
    {
      id: 'POST00004',
      coverUrl: 'https://via.placeholder.com/100x100',
      title: '春季穿搭指南',
      content:
        '春天来了，是时候更新你的衣柜了！这篇春季穿搭指南将帮助你选择最适合的服装和配饰，让你在这个春天焕然一新。从基础单品到流行趋势...',
      createTime: '2023-02-28 11:20',
      status: 'published',
      type: 'video',
    },
  ])

  // 模拟草稿数据
  const [draftsData, setDraftsData] = useState<PostData[]>([
    {
      id: 'DRAFT00001',
      coverUrl: 'https://via.placeholder.com/100x100',
      title: '健身计划（草稿）',
      content:
        '这是一份为期30天的健身计划，适合初学者。内容包括每日锻炼内容、饮食建议和休息安排。第一周主要是热身...',
      createTime: '2023-03-18 10:00',
      type: 'image',
    },
    {
      id: 'DRAFT00002',
      coverUrl: 'https://via.placeholder.com/100x100',
      title: '读书笔记（草稿）',
      content:
        '《活着》读书笔记，这本书给我的感触很深。余华通过富贵的一生，展示了中国近现代的历史变迁...',
      createTime: '2023-03-16 16:30',
      type: 'image',
    },
  ])

  // 当路由变化时，更新活动菜单
  useEffect(() => {
    if (type && typeof type === 'string') {
      const validMenus: MenuType[] = [
        'publish',
        'drafts',
        'works',
        'profile',
        'notifications',
      ]
      if (validMenus.includes(type as MenuType)) {
        setActiveMenu(type as MenuType)
      } else {
        // 如果是无效的菜单类型，重定向到 /post/publish
        router.replace('/post/publish')
      }
    }
  }, [type, router])

  // 当发布完成时回到列表页面
  const handlePublishComplete = () => {
    setIsEditing(false)
    setUploadedFiles([])
    setUploadedVideo(null)
    setFileList([])
    // 切换到作品列表
    handleMenuChange('works')
  }

  // 当菜单变化时更新 URL
  const handleMenuChange = (menu: MenuType) => {
    setActiveMenu(menu)
    // 如果正在编辑模式，退出编辑模式
    if (isEditing && menu !== 'publish') {
      setIsEditing(false)
    }
  }

  // 编辑笔记
  const handleEdit = (id: string) => {
    message.info(`编辑笔记: ${id}`)
    // 实际项目中，这里应该跳转到编辑页面或加载编辑表单
  }

  // 删除笔记
  const handleDelete = (id: string) => {
    // 根据当前激活的菜单删除对应数据
    if (activeMenu === 'works') {
      setPostsData(postsData.filter((post) => post.id !== id))
      message.success('笔记已删除')
    } else if (activeMenu === 'drafts') {
      setDraftsData(draftsData.filter((draft) => draft.id !== id))
      message.success('草稿已删除')
    }
  }

  // 搜索笔记（笔记管理）
  const handleSearch = (value: string) => {
    setSearchText(value)
  }

  // 搜索草稿
  const handleDraftSearch = (value: string) => {
    setSearchDraftText(value)
  }

  // 过滤笔记数据
  const filteredPosts = postsData.filter((post) => {
    // 根据标签页过滤
    if (activeWorksTab !== 'all' && post.status !== activeWorksTab) {
      return false
    }

    // 根据搜索关键词过滤
    if (
      searchText &&
      !(
        post.title.toLowerCase().includes(searchText.toLowerCase()) ||
        post.content.toLowerCase().includes(searchText.toLowerCase()) ||
        post.id.toLowerCase().includes(searchText.toLowerCase())
      )
    ) {
      return false
    }

    return true
  })

  // 过滤草稿数据
  const filteredDrafts = draftsData.filter(
    (draft) =>
      !searchDraftText ||
      draft.title.toLowerCase().includes(searchDraftText.toLowerCase()) ||
      draft.content.toLowerCase().includes(searchDraftText.toLowerCase()) ||
      draft.id.toLowerCase().includes(searchDraftText.toLowerCase())
  )

  // 定义笔记表格列
  const postColumns: ColumnsType<PostData> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
    },
    {
      title: '封面',
      dataIndex: 'coverUrl',
      key: 'cover',
      width: 120,
      render: (coverUrl: string) => (
        <Image
          src={coverUrl}
          alt="帖子封面"
          width={80}
          height={80}
          style={{ objectFit: 'cover' }}
          className={styles.postCover}
        />
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
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
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <Tag color={type === 'video' ? 'blue' : 'green'}>
          {type === 'video' ? '视频' : '图文'}
        </Tag>
      ),
    },
    {
      title: '发布时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: PostData) => (
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
            cancelText="取消">
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // 定义草稿表格列
  const draftColumns: ColumnsType<PostData> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
    },
    {
      title: '封面',
      dataIndex: 'coverUrl',
      key: 'cover',
      width: 120,
      render: (coverUrl: string) => (
        <Image
          src={coverUrl}
          alt="草稿封面"
          width={80}
          height={80}
          style={{ objectFit: 'cover' }}
          className={styles.postCover}
        />
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
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
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <Tag color={type === 'video' ? 'blue' : 'green'}>
          {type === 'video' ? '视频' : '图文'}
        </Tag>
      ),
    },
    {
      title: '保存时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: PostData) => (
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
            cancelText="取消">
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // 处理文件上传
  const handleUploadChange: UploadProps['onChange'] = ({
    fileList: newFileList,
    file,
  }) => {
    if (activeTab === 'image') {
      setFileList(newFileList)

      // 当有文件已上传完成时，进入编辑模式
      if (file.status === 'done') {
        const files = newFileList
          .filter((f) => f.originFileObj)
          .map((f) => f.originFileObj as File)

        if (files.length > 0) {
          setUploadedFiles(files)
          setIsEditing(true)
        }
      }
    } else if (activeTab === 'video' && file.originFileObj) {
      // 处理视频上传
      setUploadedVideo(file.originFileObj as File)
      setIsEditing(true)
    }
  }

  // 自定义上传前检查
  const beforeUpload = (file: File) => {
    if (activeTab === 'video') {
      const isVideo = file.type.startsWith('video/')
      if (!isVideo) {
        message.error('只能上传视频文件！')
        return false
      }

      // 检查视频大小
      const isSizeValid = file.size / 1024 / 1024 < 100 // 小于100MB
      if (!isSizeValid) {
        message.error('视频必须小于100MB！')
        return false
      }

      // 视频只允许上传一个
      setUploadedVideo(file)
      setIsEditing(true)
    } else {
      const isImage = file.type.startsWith('image/')
      if (!isImage) {
        message.error('只能上传图片文件！')
        return false
      }

      // 检查图片大小
      const isSizeValid = file.size / 1024 / 1024 < 10 // 小于10MB
      if (!isSizeValid) {
        message.error('图片必须小于10MB！')
        return false
      }

      // 自动进入编辑模式
      const files = [...uploadedFiles, file]
      setUploadedFiles(files)
      setIsEditing(true)
    }

    // 返回 false 以使用自定义上传逻辑，而不是自动上传
    return false
  }

  // 打开PostModal弹窗
  const handleOpenPostModal = (record: PostData) => {
    // 将PostData转换为PostItem格式
    const postItem: PostItem = {
      ...record,
      author: {
        id: 'user_001', // 添加用户ID
        name: 'momo',
        avatar: 'https://via.placeholder.com/40',
      },
      images:
        record.type === 'image'
          ? [record.coverUrl, 'https://via.placeholder.com/400x600']
          : [],
      likes: 123,
      comments: 45,
      saves: 67,
      createdAt: record.createTime,
      updatedAt: record.createTime,
    }

    setSelectedPost(postItem)
    setIsModalVisible(true)
  }

  // 关闭PostModal弹窗
  const handleClosePostModal = () => {
    setIsModalVisible(false)
    setSelectedPost(null)
  }

  // 处理表格行点击事件
  const handleRowClick = (record: PostData) => {
    return {
      onClick: (e: React.MouseEvent) => {
        // 如果点击的是操作按钮，不触发弹窗
        if (
          (e.target as HTMLElement).closest('.ant-btn') ||
          (e.target as HTMLElement).closest('.ant-popover-open')
        ) {
          return
        }
        handleOpenPostModal(record)
      },
    }
  }

  // 处理关注/取消关注
  const handleToggleFollow = (
    userId: string,
    isCurrentlyFollowing: boolean,
    isFollower: boolean
  ) => {
    const updateData = (data: UserFollowItem[]) =>
      data.map((user) =>
        user.id === userId
          ? { ...user, isFollowing: !isCurrentlyFollowing }
          : user
      )

    if (isFollower) {
      setFollowersData(updateData(followersData))
    } else {
      setFollowingData(updateData(followingData))
    }
  }

  // 渲染关注/粉丝列表
  const renderFollowList = () => {
    const data = followTab === 'following' ? followingData : followersData

    return (
      <div className={styles.followListContainer}>
        {data.length > 0 ? (
          data.map((user) => (
            <div key={user.id} className={styles.userCard}>
              <div className={styles.userInfo}>
                <div className={styles.userAvatar}>
                  <img src={user.avatar} alt={user.nickname} />
                </div>
                <div className={styles.userDetails}>
                  <div className={styles.userName}>{user.nickname}</div>
                  <div className={styles.userDescription}>
                    {user.description}
                  </div>
                </div>
              </div>
              <button
                className={`${styles.followButton} ${
                  user.isFollowing ? styles.following : ''
                }`}
                onClick={() =>
                  handleToggleFollow(
                    user.id,
                    user.isFollowing,
                    followTab === 'followers'
                  )
                }>
                {user.isFollowing ? '已关注' : '关注'}
              </button>
            </div>
          ))
        ) : (
          <div className={styles.emptyContent}>
            <div className={styles.emptyIcon}>
              <img src="/images/empty-follow.png" alt="暂无数据" />
            </div>
            <p>{followTab === 'following' ? '暂无关注' : '暂无粉丝'}</p>
          </div>
        )}
      </div>
    )
  }

  // 模拟加载个人主页笔记数据
  const loadProfilePosts = useCallback(() => {
    // 实际项目中应该从API获取数据
    setIsLoadingPosts(true);
    setUserHasNoPosts(false); // 确保变量已定义

    // 模拟网络请求延迟
    setTimeout(() => {
      // 第一页显示一些数据，后续加载空数据表示加载完毕
      if (profilePostsPage === 1) {
        const userPosts: Post[] = [
          {
            id: 'user_post_1',
            title: '周末探店：上海最美咖啡馆',
            content:
              '发现了这家藏在小巷子里的咖啡馆，环境非常好，很适合拍照...',
            coverUrl: 'https://via.placeholder.com/300x400',
            author: {
              id: 'user_001',
              name: 'momo',
              avatar: 'https://via.placeholder.com/40',
            },
            likes: 235,
            createdAt: '2023-04-12T08:30:00Z',
            updatedAt: '2023-04-12T08:30:00Z',
            height: 400,
            width: 300,
          },
          {
            id: 'user_post_2',
            title: '春季穿搭指南',
            content:
              '分享几套我最近很喜欢的春季搭配，温度变化多端的春天应该这样穿...',
            coverUrl: 'https://via.placeholder.com/400x600',
            author: {
              id: 'user_001',
              name: 'momo',
              avatar: 'https://via.placeholder.com/40',
            },
            likes: 178,
            createdAt: '2023-03-28T10:15:00Z',
            updatedAt: '2023-03-28T10:15:00Z',
            height: 600,
            width: 400,
          },
          {
            id: 'user_post_3',
            title: '家居布置小技巧',
            content: '如何让小户型看起来更宽敞？分享我的几个实用布置技巧...',
            coverUrl: 'https://via.placeholder.com/500x300',
            author: {
              id: 'user_001',
              name: 'momo',
              avatar: 'https://via.placeholder.com/40',
            },
            likes: 132,
            createdAt: '2023-03-15T16:45:00Z',
            updatedAt: '2023-03-15T16:45:00Z',
            height: 300,
            width: 500,
          },
          {
            id: 'user_post_4',
            title: '新手化妆入门指南',
            content: '零基础也能快速上手的化妆技巧，从底妆到眼妆全都有...',
            coverUrl: 'https://via.placeholder.com/350x450',
            author: {
              id: 'user_001',
              name: 'momo',
              avatar: 'https://via.placeholder.com/40',
            },
            likes: 89,
            createdAt: '2023-03-02T13:20:00Z',
            updatedAt: '2023-03-02T13:20:00Z',
            height: 450,
            width: 350,
          },
          {
            id: 'user_post_7',
            title: '复古风穿搭灵感',
            content:
              '这季流行复古风格，分享几套我最近的搭配，复古又不失时尚感...',
            coverUrl: 'https://via.placeholder.com/400x500',
            author: {
              id: 'user_001',
              name: 'momo',
              avatar: 'https://via.placeholder.com/40',
            },
            likes: 156,
            createdAt: '2023-04-15T11:20:00Z',
            updatedAt: '2023-04-15T11:20:00Z',
            height: 500,
            width: 400,
          },
          {
            id: 'user_post_8',
            title: '旅行必备小物件',
            content: '分享我每次旅行都会带的几样小物件，真的太实用了！',
            coverUrl: 'https://via.placeholder.com/450x350',
            author: {
              id: 'user_001',
              name: 'momo',
              avatar: 'https://via.placeholder.com/40',
            },
            likes: 203,
            createdAt: '2023-04-08T16:30:00Z',
            updatedAt: '2023-04-08T16:30:00Z',
            height: 350,
            width: 450,
          },
        ]

        setProfilePosts(userPosts)
      } else if (profilePostsPage === 2) {
        // 第二页添加更多数据
        const morePosts: Post[] = [
          {
            id: 'user_post_5',
            title: '我的阅读书单推荐',
            content: '这个月读了这几本书，很有收获，推荐给大家...',
            coverUrl: 'https://via.placeholder.com/380x480',
            author: {
              id: 'user_001',
              name: 'momo',
              avatar: 'https://via.placeholder.com/40',
            },
            likes: 76,
            createdAt: '2023-02-18T09:40:00Z',
            updatedAt: '2023-02-18T09:40:00Z',
            height: 480,
            width: 380,
          },
          {
            id: 'user_post_6',
            title: '宠物日常护理小知识',
            content: '养宠必备的日常护理知识，让你家的毛孩子更健康...',
            coverUrl: 'https://via.placeholder.com/420x320',
            author: {
              id: 'user_001',
              name: 'momo',
              avatar: 'https://via.placeholder.com/40',
            },
            likes: 103,
            createdAt: '2023-02-05T14:10:00Z',
            updatedAt: '2023-02-05T14:10:00Z',
            height: 320,
            width: 420,
          },
          {
            id: 'user_post_9',
            title: '手工皮具制作体验',
            content: '上周去参加了一个皮具制作的工作坊，分享一下心得...',
            coverUrl: 'https://via.placeholder.com/330x440',
            author: {
              id: 'user_001',
              name: 'momo',
              avatar: 'https://via.placeholder.com/40',
            },
            likes: 88,
            createdAt: '2023-01-25T13:15:00Z',
            updatedAt: '2023-01-25T13:15:00Z',
            height: 440,
            width: 330,
          },
          {
            id: 'user_post_10',
            title: '拍照构图小技巧',
            content:
              '不需要专业设备，掌握这几个简单的构图方法让你的照片更出色...',
            coverUrl: 'https://via.placeholder.com/450x380',
            author: {
              id: 'user_001',
              name: 'momo',
              avatar: 'https://via.placeholder.com/40',
            },
            likes: 142,
            createdAt: '2023-01-18T10:45:00Z',
            updatedAt: '2023-01-18T10:45:00Z',
            height: 380,
            width: 450,
          },
        ]

        setProfilePosts((prev) => [...prev, ...morePosts])
      } else if (profilePostsPage === 3) {
        // 第三页添加更多数据
        const morePosts: Post[] = [
          {
            id: 'user_post_11',
            title: '冬季护肤必备品',
            content: '天气干燥皮肤容易缺水，这些护肤品一定要准备好...',
            coverUrl: 'https://via.placeholder.com/400x550',
            author: {
              id: 'user_001',
              name: 'momo',
              avatar: 'https://via.placeholder.com/40',
            },
            likes: 167,
            createdAt: '2023-01-10T14:20:00Z',
            updatedAt: '2023-01-10T14:20:00Z',
            height: 550,
            width: 400,
          },
          {
            id: 'user_post_12',
            title: '简易家常菜谱分享',
            content: '适合上班族的快手菜谱，简单又好吃，十分钟就能上桌...',
            coverUrl: 'https://via.placeholder.com/500x350',
            author: {
              id: 'user_001',
              name: 'momo',
              avatar: 'https://via.placeholder.com/40',
            },
            likes: 205,
            createdAt: '2023-01-05T18:30:00Z',
            updatedAt: '2023-01-05T18:30:00Z',
            height: 350,
            width: 500,
          },
          {
            id: 'user_post_13',
            title: '我的极简生活方式',
            content: '如何通过断舍离让生活变得更加简单高效...',
            coverUrl: 'https://via.placeholder.com/380x420',
            author: {
              id: 'user_001',
              name: 'momo',
              avatar: 'https://via.placeholder.com/40',
            },
            likes: 133,
            createdAt: '2022-12-28T11:20:00Z',
            updatedAt: '2022-12-28T11:20:00Z',
            height: 420,
            width: 380,
          },
          {
            id: 'user_post_14',
            title: '城市夜景摄影技巧',
            content: '如何在夜晚拍出璀璨迷人的城市夜景照片...',
            coverUrl: 'https://via.placeholder.com/500x400',
            author: {
              id: 'user_001',
              name: 'momo',
              avatar: 'https://via.placeholder.com/40',
            },
            likes: 198,
            createdAt: '2022-12-21T20:15:00Z',
            updatedAt: '2022-12-21T20:15:00Z',
            height: 400,
            width: 500,
          },
        ]

        setProfilePosts((prev) => [...prev, ...morePosts])
      }

      setIsLoadingPosts(false);
    }, 800);
  }, [profilePostsPage]);

  // 加载更多笔记
  const handleLoadMorePosts = useCallback(() => {
    if (!isLoadingPosts && profilePostsPage < 4) {
      setProfilePostsPage((prev) => prev + 1)
    }
  }, [isLoadingPosts, profilePostsPage])

  // 当切换到个人主页的笔记标签时加载数据
  useEffect(() => {
    if (activeMenu === 'profile' && activeProfileTab === 'all') {
      if (profilePosts.length === 0) {
        loadProfilePosts()
      }
    }
  }, [activeMenu, activeProfileTab, loadProfilePosts, profilePosts.length])

  // 处理通知标签页切换
  const handleNotificationTabChange = (tab: 'like' | 'follow' | 'system') => {
    setActiveNotificationTab(tab)
  }

  // 渲染通知内容
  const renderNotificationsContent = () => {
    const filteredNotifications = notifications.filter(
      (notification) => notification.type === activeNotificationTab
    )

    if (filteredNotifications.length === 0) {
      return (
        <div className={styles.emptyContent}>
          <div className={styles.emptyIcon}>
            <BellOutlined />
          </div>
          <div className={styles.emptyText}>
            暂无
            {activeNotificationTab === 'like'
              ? '点赞'
              : activeNotificationTab === 'follow'
              ? '关注'
              : '系统'}
            通知
          </div>
        </div>
      )
    }

    return (
      <div className={styles.notificationList}>
        {filteredNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`${styles.notificationItem} ${
              notification.isRead ? styles.read : ''
            }`}>
            {notification.type === 'like' && (
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

            {notification.type === 'follow' && (
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

            {notification.type === 'system' && (
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
    )
  }

  // 渲染右侧内容
  const renderContent = () => {
    switch (activeMenu) {
      case 'publish':
        if (isEditing) {
          if (activeTab === 'video' && uploadedVideo) {
            return (
              <PublishVideoPage
                initialVideo={uploadedVideo}
                onBack={() => {
                  setIsEditing(false)
                  setUploadedVideo(null)
                }}
                onPublish={handlePublishComplete}
              />
            )
          } else if (activeTab === 'image') {
            return (
              <PublishPage
                initialImages={uploadedFiles}
                onBack={() => {
                  setIsEditing(false)
                  setUploadedFiles([])
                  setFileList([])
                }}
                onPublish={handlePublishComplete}
              />
            )
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
                      activeTab === 'video' ? styles.active : ''
                    }`}
                    onClick={() => setActiveTab('video')}>
                    上传视频
                  </button>
                  <button
                    className={`${styles.tab} ${
                      activeTab === 'image' ? styles.active : ''
                    }`}
                    onClick={() => setActiveTab('image')}>
                    上传图文
                  </button>
                </div>

                {activeTab === 'image' && (
                  <Upload.Dragger
                    name="files"
                    fileList={fileList}
                    onChange={handleUploadChange}
                    beforeUpload={beforeUpload}
                    multiple={true}
                    accept="image/*"
                    showUploadList={false}
                    className={styles.uploadArea}>
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
                {activeTab === 'video' && (
                  <Upload.Dragger
                    name="file"
                    onChange={handleUploadChange}
                    beforeUpload={beforeUpload}
                    multiple={false}
                    accept="video/*"
                    showUploadList={false}
                    className={styles.uploadArea}>
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
          )
        }
        break

      case 'drafts':
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
                pagination={{ pageSize: 10 }}
                onRow={handleRowClick}
                className={styles.clickableTable}
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
        )

      case 'works':
        const handleWorksTabChange = (
          tab: 'all' | 'published' | 'reviewing' | 'rejected'
        ) => {
          setActiveWorksTab(tab)
        }

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
                    activeWorksTab === 'all' ? styles.active : ''
                  }`}
                  onClick={() => handleWorksTabChange('all')}>
                  全部笔记({filteredPosts.length})
                </div>
                <div
                  className={`${styles.tabItem} ${
                    activeWorksTab === 'published' ? styles.active : ''
                  }`}
                  onClick={() => handleWorksTabChange('published')}>
                  已发布
                </div>
                <div
                  className={`${styles.tabItem} ${
                    activeWorksTab === 'reviewing' ? styles.active : ''
                  }`}
                  onClick={() => handleWorksTabChange('reviewing')}>
                  审核中
                </div>
                <div
                  className={`${styles.tabItem} ${
                    activeWorksTab === 'rejected' ? styles.active : ''
                  }`}
                  onClick={() => handleWorksTabChange('rejected')}>
                  未通过
                </div>
              </div>
            </div>

            <div className={styles.tableContainer}>
              {filteredPosts.length > 0 ? (
                <Table
                  columns={postColumns}
                  dataSource={filteredPosts}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  onRow={handleRowClick}
                  className={styles.clickableTable}
                />
              ) : (
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
        )

      case 'profile':
        const handleProfileTabChange = (tab: 'all' | 'stats' | 'followers') => {
          setActiveProfileTab(tab)
        }

        // 模拟用户数据
        const userInfo = {
          avatar: 'https://via.placeholder.com/80',
          nickname: 'momo',
          accountId: '2674975268',
          followCount: 5,
          fansCount: 2,
          likeCount: 123,
          collectCount: 45,
          postCount: userHasNoPosts ? 0 : profilePosts.length,
        }

        // 模拟统计数据
        const statsData = [
          { label: '总浏览', value: 1024 },
          { label: '平均停留', value: 45, unit: '秒' },
          { label: '互动量', value: 128 },
          { label: '分享量', value: 32 },
        ]

        return (
          <div className={styles.container}>
            <div className={styles.header}>
              <h1>个人主页</h1>
            </div>

            <div className={styles.profileSection}>
              <div className={styles.profileHeader}>
                <div className={styles.profileAvatar}>
                  <img src={userInfo.avatar} alt={userInfo.nickname} />
                </div>
                <div className={styles.profileInfo}>
                  <h2 className={styles.profileName}>{userInfo.nickname}</h2>
                  <div className={styles.profileId}>
                    小红书号：{userInfo.accountId}
                  </div>
                  <div className={styles.profileDesc}>
                    这个人很懒，什么都没有写~
                  </div>
                </div>
              </div>

              <div className={styles.profileTabs}>
                <div className={styles.tabsNav}>
                  <div
                    className={`${styles.tabItem} ${
                      activeProfileTab === 'all' ? styles.active : ''
                    }`}
                    onClick={() => handleProfileTabChange('all')}>
                    笔记 {userInfo.postCount}
                  </div>
                  <div
                    className={`${styles.tabItem} ${
                      activeProfileTab === 'stats' ? styles.active : ''
                    }`}
                    onClick={() => handleProfileTabChange('stats')}>
                    数据统计
                  </div>
                  <div
                    className={`${styles.tabItem} ${
                      activeProfileTab === 'followers' ? styles.active : ''
                    }`}
                    onClick={() => handleProfileTabChange('followers')}>
                    关注/粉丝
                  </div>
                </div>
              </div>

              {activeProfileTab === 'all' && (
                <div className={styles.notesSection}>
                  {userHasNoPosts ? (
                    <div className={styles.emptyContent}>
                      <div className={styles.emptyIcon}>
                        <img src="/images/empty-notes.png" alt="暂无笔记" />
                      </div>
                      <p>还没有发布过笔记哦</p>
                      <button
                        className={styles.createButton}
                        onClick={() => handleMenuChange('publish')}>
                        去发布第一篇笔记
                      </button>
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
              )}

              {activeProfileTab === 'stats' && (
                <div className={styles.statsContainer}>
                  <div className={styles.statsGrid}>
                    <div className={styles.statItem}>
                      <div className={styles.statValue}>
                        {userInfo.postCount}
                        <span className={styles.statUnit}>篇</span>
                      </div>
                      <div className={styles.statLabel}>发布笔记</div>
                    </div>
                    <div className={styles.statItem}>
                      <div className={styles.statValue}>
                        {userInfo.likeCount}
                        <span className={styles.statUnit}>次</span>
                      </div>
                      <div className={styles.statLabel}>获赞与收藏</div>
                    </div>
                  </div>

                  <div className={styles.statCharts}>
                    <div className={styles.chartTitle}>数据趋势</div>
                    <div className={styles.chartPlaceholder}>
                      数据统计图表将在这里显示
                    </div>
                  </div>
                </div>
              )}

              {activeProfileTab === 'followers' && (
                <div className={styles.followContainer}>
                  <div className={styles.followTabs}>
                    <div
                      className={`${styles.followTab} ${
                        followTab === 'following' ? styles.active : ''
                      }`}
                      onClick={() => setFollowTab('following')}>
                      关注 {followingData.length}
                    </div>
                    <div
                      className={`${styles.followTab} ${
                        followTab === 'followers' ? styles.active : ''
                      }`}
                      onClick={() => setFollowTab('followers')}>
                      粉丝 {followersData.length}
                    </div>
                  </div>

                  {renderFollowList()}
                </div>
              )}
            </div>
          </div>
        )

      case 'notifications':
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
                    key as 'like' | 'follow' | 'system'
                  )
                }
                items={[
                  {
                    key: 'like',
                    label: (
                      <span>
                        <HeartOutlined />
                        点赞
                      </span>
                    ),
                  },
                  {
                    key: 'follow',
                    label: (
                      <span>
                        <UserAddOutlined />
                        关注
                      </span>
                    ),
                  },
                  {
                    key: 'system',
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
        )

      default:
        return <div>无效的菜单选项</div>
    }
  }

  return (
    <>
      <Head>
        <title>
          {activeMenu === 'publish'
            ? '发布笔记'
            : activeMenu === 'drafts'
            ? '草稿箱'
            : activeMenu === 'profile'
            ? '个人主页'
            : activeMenu === 'notifications'
            ? '通知中心'
            : '笔记管理'}{' '}
          - 小蓝书
        </title>
      </Head>
      <PostHeader />
      <div className={styles.layout}>
        <div className={styles.main}>
          <SideMenu
            activeMenu={activeMenu}
            onMenuChange={handleMenuChange}
          />
          {renderContent()}
        </div>
      </div>
    </>
  )
}

export default Post
