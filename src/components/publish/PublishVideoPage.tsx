import React, { useState, useRef, useEffect } from "react";
import { message, Popover, Button, Modal, Progress, Spin, Upload } from "antd";
import {
  LeftOutlined,
  SmileOutlined,
  UploadOutlined,
  LoadingOutlined,
  ReloadOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { UploadProps } from "antd";
import styles from "./PublishVideoPage.module.scss";
import {
  uploadFile,
  createPost,
  saveDraft,
  deleteUploadedFile,
  updatePost,
} from "@/api/services/posts";
import { useRouter } from "next/router";
import {
  extractImageUrl,
  createSecureFile,
  extractVideoCover,
  blobToFile,
} from "@/utils/upload-helper";

// 常用表情列表
const emojiList = [
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
  "🤩",
  "😘",
  "😗",
  "😚",
  "😙",
  "😋",
  "😛",
  "😜",
  "🤪",
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
];

interface PublishVideoPageProps {
  initialVideo?: File;
  onBack: () => void;
  onPublish?: () => void;
  editData?: any; // 添加编辑模式的数据
}

const PublishVideoPage: React.FC<PublishVideoPageProps> = ({
  initialVideo,
  onBack,
  onPublish,
  editData,
}) => {
  const router = useRouter();
  const [title, setTitle] = useState<string>(editData?.title || "");
  const [content, setContent] = useState<string>(editData?.content || "");
  const [textLength, setTextLength] = useState(editData?.content?.length || 0);
  const contentInputRef = useRef<HTMLTextAreaElement>(null);
  const [videoUrl, setVideoUrl] = useState<string>(editData?.files?.[0] || "");
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoPreviewError, setVideoPreviewError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(
    editData?.files?.[0] || null
  );
  const [videoDuration, setVideoDuration] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPublishingModal, setShowPublishingModal] = useState(false);
  const [publishProgress, setPublishProgress] = useState(0);
  const [actionType, setActionType] = useState<"publish" | "draft">("publish");
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(
    editData?.coverImage || null
  );

  // 判断是否在弹窗中（编辑模式）
  const isModal = !!editData;

  // 存储临时上传的视频URL，便于在用户不发布时删除
  const [tempVideoUrl, setTempVideoUrl] = useState<string | null>(
    editData?.files?.[0] || null
  );

  // 添加标记，确保初始视频只被处理一次
  const initialVideoProcessedRef = useRef<boolean>(false);

  // 如果是编辑模式，加载现有视频
  useEffect(() => {
    if (editData && editData.files && editData.files.length > 0) {
      console.log("编辑模式，加载现有视频:", editData.files[0]);
      const videoUrl = editData.files[0];
      setVideoUrl(videoUrl);
      setUploadedFileUrl(videoUrl);
      setTempVideoUrl(videoUrl);
      setSelectedVideoFile({ name: "已有视频" } as File); // 添加一个伪文件对象，确保显示视频而不是上传界面

      // 设置视频封面（如果存在）
      if (editData.coverImage) {
        console.log("编辑模式，加载现有视频封面:", editData.coverImage);
        const coverUrl = editData.coverImage.startsWith("http")
          ? editData.coverImage
          : `http://localhost:8080${editData.coverImage}`;
        setCoverImageUrl(coverUrl);
      }

      // 恢复视频会话
      handleRestoreVideoSession(videoUrl);
    }
  }, [editData]);

  // 组件加载和卸载时处理
  useEffect(() => {
    // 只有在组件首次挂载且有初始视频时才处理它
    if (initialVideo && !initialVideoProcessedRef.current) {
      initialVideoProcessedRef.current = true; // 标记初始视频已处理
      processNewVideo(initialVideo);
    } else if (!initialVideoProcessedRef.current) {
      initialVideoProcessedRef.current = true; // 标记已处理过初始状态检查

      // 检查是否有未完成的上传
      const storedUpload = sessionStorage.getItem("tempVideoUpload");
      if (storedUpload) {
        try {
          const { tempUrl, uploadTime } = JSON.parse(storedUpload);

          // 如果上传时间超过2小时，认为已过期
          const TWO_HOURS = 2 * 60 * 60 * 1000;
          const isExpired = new Date().getTime() - uploadTime > TWO_HOURS;

          if (!isExpired) {
            setTempVideoUrl(tempUrl);
            setUploadedFileUrl(tempUrl);
            handleRestoreVideoSession(tempUrl);
            message.info("已恢复未完成的视频上传");
          } else {
            // 清除过期的存储
            sessionStorage.removeItem("tempVideoUpload");
            // 尝试删除过期的临时文件
            try {
              deleteUploadedFile(tempUrl).catch((err) =>
                console.error("删除过期临时文件失败:", err)
              );
            } catch (error) {
              console.error("尝试删除过期文件出错:", error);
            }
          }
        } catch (error) {
          console.error("解析存储的上传信息失败:", error);
          sessionStorage.removeItem("tempVideoUpload");
        }
      }
    }

    // 添加页面可见性变化监听
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && tempVideoUrl) {
        // 页面被隐藏且有临时视频时，记录信息到会话存储
        const uploadInfo = {
          tempUrl: tempVideoUrl,
          uploadTime: new Date().getTime(),
        };
        sessionStorage.setItem("tempVideoUpload", JSON.stringify(uploadInfo));
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 添加窗口关闭事件监听
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // 如果正在上传视频或有未保存的临时视频，提示用户
      if (isUploading || (tempVideoUrl && !isPublishing)) {
        // 如果有未保存的临时视频，提示用户
        e.preventDefault();
        e.returnValue = isUploading
          ? "视频正在上传中，离开页面将中断上传。确定要离开吗？"
          : "您有未保存的视频，确定要离开吗？";

        // 保存到会话存储以便可能的恢复
        if (tempVideoUrl) {
          const uploadInfo = {
            tempUrl: tempVideoUrl,
            uploadTime: new Date().getTime(),
          };
          sessionStorage.setItem("tempVideoUpload", JSON.stringify(uploadInfo));
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    // 组件卸载时清理逻辑
    return () => {
      // 只在非编辑模式且组件真正卸载时删除临时视频，而不是在tempVideoUrl变化时
      if (tempVideoUrl && !isPublishing && !isModal) {
        console.log("组件卸载，尝试删除临时上传的视频:", tempVideoUrl);
        handleDeleteTempVideo();
      }

      // 如果有本地预览URL，需要释放
      if (videoUrl && videoUrl.startsWith("blob:")) {
        URL.revokeObjectURL(videoUrl);
      }

      // 移除事件监听器
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isPublishing, isModal]); // 添加isModal依赖，确保逻辑正确响应模式变化

  // 视频选择处理（已被替换为Upload的beforeUpload直接处理，保留此函数以兼容可能的其他调用）
  const handleVideoSelect = (file: File) => {
    console.log("handleVideoSelect已废弃，请使用Upload组件选择视频");
    // 不再执行任何处理逻辑，避免重复上传
  };

  // 处理新选择的视频
  const processNewVideo = (file: File) => {
    // 防止处理过程中再次点击上传
    if (isUploading) {
      console.log("已有上传任务正在进行中，忽略新的上传请求");
      return;
    }

    // 如果已经上传过相同的文件，不重复上传
    if (
      selectedVideoFile &&
      selectedVideoFile.name === file.name &&
      selectedVideoFile.size === file.size &&
      selectedVideoFile.lastModified === file.lastModified
    ) {
      console.log("跳过重复上传相同的视频文件");
      return;
    }

    // 验证视频
    const validation = validateVideo(file);
    if (!validation.valid) {
      message.error(validation.message || "视频验证失败");
      return;
    }

    // 设置文件为已选择状态
    setSelectedVideoFile(file);

    // 重置视频相关状态
    setVideoLoaded(false);
    setVideoPreviewError(false);

    // 先设置本地预览
    const localPreviewUrl = URL.createObjectURL(file);
    console.log("创建本地视频预览URL");
    setVideoUrl(localPreviewUrl);

    // 预加载本地视频并获取时长信息
    const tempVideo = document.createElement("video");
    tempVideo.preload = "metadata";

    tempVideo.onloadedmetadata = () => {
      if (tempVideo.duration > 0) {
        console.log(
          "本地视频元数据已加载，时长:",
          tempVideo.duration.toFixed(2)
        );
        setVideoDuration(tempVideo.duration);
      }
      // 释放临时视频元素
      tempVideo.src = "";
    };

    tempVideo.onerror = () => {
      console.error("本地视频预览加载失败");
      // 继续上传，但记录错误
    };

    tempVideo.src = localPreviewUrl;

    // 立即开始上传
    handleUploadVideo(file);
  };

  // 恢复已上传的视频会话
  const handleRestoreVideoSession = (videoUrl: string) => {
    // 设置视频URL和加载状态
    setVideoUrl(videoUrl);
    setVideoLoaded(false);
    setVideoPreviewError(false);

    // 创建视频元素获取元数据
    const video = document.createElement("video");

    // 添加跨域属性以防止跨域问题
    video.crossOrigin = "anonymous";

    // 监听元数据加载
    video.onloadedmetadata = () => {
      console.log("恢复的视频元数据已加载, 时长:", video.duration);
      setVideoDuration(video.duration);
      setVideoLoaded(true);
    };

    video.onerror = (e) => {
      console.error("恢复的视频预览加载失败:", e);
      console.error("视频URL:", videoUrl);
      setVideoPreviewError(true);
      message.error("视频预览加载失败，请重新上传");
    };

    // 先设置事件监听器，再设置src
    video.src = videoUrl;
    video.load(); // 强制加载
  };

  // 验证视频
  const validateVideo = (file: File): { valid: boolean; message?: string } => {
    // 检查文件类型
    const isVideo = file.type.startsWith("video/");
    if (!isVideo) {
      return { valid: false, message: "只能上传视频文件！" };
    }

    // 检查视频大小
    const isSizeValid = file.size / 1024 / 1024 < 100; // 小于100MB
    if (!isSizeValid) {
      return { valid: false, message: "视频必须小于100MB！" };
    }

    return { valid: true };
  };

  // 上传视频到服务器
  const handleUploadVideo = async (file: File) => {
    // 添加详细调试日志
    console.log(
      `准备上传视频文件 - 名称: ${file.name}, 大小: ${Math.round(
        file.size / 1024 / 1024
      )}MB, 类型: ${file.type}`
    );

    // 如果已经在上传中，防止重复上传
    if (isUploading) {
      console.log("已有上传任务正在进行中，跳过");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 创建安全文件名的文件对象
      const secureFile = createSecureFile(file);
      console.log(`原始文件名: ${file.name}, 安全文件名: ${secureFile.name}`);

      // 上传进度回调
      const onProgress = (percent: number) => {
        // 优化日志输出，只在进度变化较大时打印
        if (percent % 10 === 0 || percent === 100) {
          console.log("视频上传进度:", percent);
        }
        setUploadProgress(percent);
      };

      // 上传视频
      const response = await uploadFile(secureFile, "video", onProgress);

      // 提取视频URL
      const videoUrl = extractImageUrl(response);
      if (!videoUrl) {
        throw new Error("无法从响应中获取视频URL");
      }

      console.log("视频上传成功，URL:", videoUrl);
      setUploadedFileUrl(videoUrl);
      setTempVideoUrl(videoUrl); // 保存临时URL用于可能的删除

      // 从视频中提取封面图像
      try {
        console.log("开始从视频提取封面图像");

        // 提取视频封面
        const coverBlob = await extractVideoCover(file);
        console.log(
          "视频封面提取成功, 大小:",
          Math.round(coverBlob.size / 1024),
          "KB"
        );

        // 将Blob转换为File对象
        const coverFile = blobToFile(
          coverBlob,
          file.name.replace(/\.[^/.]+$/, "") + "_cover.jpg",
          "image/jpeg"
        );
        console.log("创建封面文件成功:", coverFile.name);

        // 上传封面图片
        const coverResponse = await uploadFile(
          coverFile,
          "image",
          (percent) => {
            console.log("封面上传进度:", percent);
          }
        );

        // 提取封面URL
        const coverUrl = extractImageUrl(coverResponse);
        if (coverUrl) {
          console.log("封面上传成功，URL:", coverUrl);
          // 处理封面URL
          const processedCoverUrl = coverUrl.startsWith("http")
            ? coverUrl
            : `http://localhost:8080${coverUrl}`;
          // 保存封面URL
          setCoverImageUrl(processedCoverUrl);
        } else {
          console.warn("无法从响应中获取封面URL，将继续但不使用封面");
        }
      } catch (err) {
        console.error("从视频提取或上传封面失败:", err);
        // 即使封面提取失败，我们仍然继续处理，因为视频上传已成功
      }

      // 生成一个客户端唯一标识符，用于标记此次上传
      const clientUploadId = `${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // 保存上传信息到会话存储
      const uploadInfo = {
        tempUrl: videoUrl,
        uploadTime: new Date().getTime(),
        clientUploadId,
      };
      sessionStorage.setItem("tempVideoUpload", JSON.stringify(uploadInfo));

      message.success("视频上传成功");

      // 使用单次定时器设置视频已加载状态，避免重复更新
      const timer = setTimeout(() => {
        console.log("设置视频为已加载状态");
        setVideoLoaded(true);

        if (videoRef.current && videoRef.current.duration > 0) {
          setVideoDuration(videoRef.current.duration);
        }

        clearTimeout(timer);
      }, 300);
    } catch (error) {
      console.error("视频上传失败:", error);
      message.error("视频上传失败，请重试");
      setVideoPreviewError(true);
    } finally {
      setIsUploading(false);
    }
  };

  // 删除临时上传的视频
  const handleDeleteTempVideo = async () => {
    if (tempVideoUrl) {
      try {
        // 保存当前值然后清空，避免重复调用
        const urlToDelete = tempVideoUrl;
        // 立即清空状态，避免useEffect触发重复调用
        setTempVideoUrl(null);

        await deleteUploadedFile(urlToDelete);
        console.log("成功删除临时视频:", urlToDelete);
      } catch (error) {
        console.error("删除临时视频失败:", error);
      }
    }
  };

  // 视频元数据加载完成
  const handleVideoMetadataLoaded = () => {
    // 避免重复处理，只在视频未加载或者时长未获取时处理
    if (!videoLoaded || videoDuration <= 0) {
      console.log("视频播放器元数据已加载");
      if (videoRef.current) {
        const duration = videoRef.current.duration;

        if (!isNaN(duration) && duration > 0 && duration !== videoDuration) {
          console.log("视频播放器获取到的时长:", duration);
          setVideoDuration(duration);
        }

        // 明确标记视频已加载，确保UI更新
        if (!videoLoaded) {
          setVideoLoaded(true);
        }
      } else {
        console.warn("视频元素引用不存在");
      }
    }
  };

  // 处理标题变化
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  // 处理内容变化
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setTextLength(newContent.length);
  };

  // 处理标题中的表情选择
  const handleTitleEmojiSelect = (emoji: string) => {
    // 在标题框中的当前位置插入表情
    const titleInput = document.querySelector(
      'input[type="text"]'
    ) as HTMLInputElement;
    if (titleInput) {
      const start = titleInput.selectionStart || 0;
      const end = titleInput.selectionEnd || 0;

      // 检查添加表情后是否会超过20个字符
      if (title.length + emoji.length > 20) {
        message.warning("标题最多20个字");
        return;
      }

      // 创建新的标题文本，在光标位置插入表情
      const newTitle = title.substring(0, start) + emoji + title.substring(end);
      setTitle(newTitle);

      // 更新光标位置到表情后面
      setTimeout(() => {
        titleInput.focus();
        titleInput.setSelectionRange(
          start + emoji.length,
          start + emoji.length
        );
      }, 0);
    }
  };

  // 处理正文中的表情选择
  const handleContentEmojiSelect = (emoji: string) => {
    if (contentInputRef.current) {
      const textarea = contentInputRef.current;
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;

      // 检查添加表情后是否会超过1000个字符
      if (content.length + emoji.length > 1000) {
        message.warning("正文最多1000个字");
        return;
      }

      // 创建新的正文内容，在光标位置插入表情
      const newContent =
        content.substring(0, start) + emoji + content.substring(end);
      setContent(newContent);
      setTextLength(newContent.length);

      // 更新光标位置到表情后面
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    }
  };

  // 格式化视频时长
  const formatDuration = (seconds: number): string => {
    if (isNaN(seconds) || seconds <= 0) {
      return "0:00";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // 处理发布
  const handlePublish = async () => {
    if (!uploadedFileUrl) {
      message.error("请先上传视频");
      return;
    }

    if (!title) {
      message.error("请输入标题");
      return;
    }

    if (!content) {
      message.error("请输入正文内容");
      return;
    }

    if (textLength > 1000) {
      message.error("正文内容超出字数限制");
      return;
    }

    try {
      setActionType("publish");
      setIsPublishing(true);
      setShowPublishingModal(true);
      setPublishProgress(80); // 由于视频已经上传，直接从80%开始

      // 创建帖子或更新帖子
      const postData = {
        title,
        content,
        type: "video" as const,
        tags: [], // 暂不支持标签，但API需要这个字段
        files: [uploadedFileUrl], // 使用已上传的视频URL
        isDraft: false, // 发布而非保存为草稿
        coverImage: coverImageUrl, // 添加封面图片URL
      };

      console.log(
        editData ? "准备更新视频帖子:" : "准备创建视频帖子:",
        postData
      );

      let response;
      if (editData) {
        // 更新现有帖子
        response = await updatePost(editData.postId, postData);
      } else {
        // 创建新帖子
        response = await createPost(postData);
      }

      console.log(
        editData ? "视频帖子更新成功:" : "视频帖子创建成功:",
        response
      );

      // 发布完成后，清除临时视频URL和会话存储
      // 如果是编辑模式且没有更换视频，则不清除tempVideoUrl
      if (!editData || (editData && tempVideoUrl !== editData.files?.[0])) {
        setTempVideoUrl(null);
        sessionStorage.removeItem("tempVideoUpload");
      }

      // 发布完成
      setPublishProgress(100);

      // 延迟关闭模态框，显示完成状态
      setTimeout(() => {
        setIsPublishing(false);
        setShowPublishingModal(false);
        message.success(editData ? "更新成功" : "发布成功");

        // 清空表单
        setTitle("");
        setContent("");
        setVideoUrl("");
        setVideoLoaded(false);
        setUploadedFileUrl(null);
        setSelectedVideoFile(null);
        setCoverImageUrl(null); // 清空封面图片URL

        // 调用回调或重定向
        if (onPublish) {
          onPublish();
        } else {
          router.push("/"); // 默认返回首页
        }
      }, 1000);
    } catch (error) {
      console.error(
        editData ? "更新视频笔记失败:" : "发布视频笔记失败:",
        error
      );
      message.error(
        editData
          ? "更新失败，请检查网络连接后重试"
          : "发布失败，请检查网络连接后重试"
      );
      setIsPublishing(false);
      setShowPublishingModal(false);
    }
  };

  // 保存草稿
  const handleSaveDraft = async () => {
    // 如果没有填写任何内容，不进行保存
    if (!uploadedFileUrl && !title && !content) {
      message.warning("请至少上传视频、添加标题或正文");
      return;
    }

    try {
      setActionType("draft");
      setIsPublishing(true);
      setShowPublishingModal(true);
      setPublishProgress(80); // 视频已上传，直接从80%开始

      // 创建草稿
      const draftData = {
        title,
        content,
        type: "video" as const,
        tags: [], // 暂不支持标签，但API需要这个字段
        files: uploadedFileUrl ? [uploadedFileUrl] : [], // 将视频URL放入files数组
        isDraft: true, // 保存为草稿
        coverImage: coverImageUrl, // 添加封面图片URL
      };

      console.log("准备保存视频草稿:", draftData);

      const response = await saveDraft(draftData);
      console.log("视频草稿保存成功:", response);

      // 保存草稿后，清除临时视频URL和会话存储
      setTempVideoUrl(null);
      sessionStorage.removeItem("tempVideoUpload");

      // 发布完成
      setPublishProgress(100);

      // 延迟关闭模态框，显示完成状态
      setTimeout(() => {
        setIsPublishing(false);
        setShowPublishingModal(false);
        message.success("草稿保存成功");

        // 清空表单
        setTitle("");
        setContent("");
        setVideoUrl("");
        setVideoLoaded(false);
        setUploadedFileUrl(null);
        setSelectedVideoFile(null);
        setCoverImageUrl(null); // 清空封面图片URL

        // 调用回调或重定向
        if (onPublish) {
          onPublish();
        } else {
          router.push("/"); // 默认返回首页
        }
      }, 1000);
    } catch (error) {
      console.error("保存草稿失败:", error);
      message.error("保存草稿失败，请检查网络连接后重试");
      setIsPublishing(false);
      setShowPublishingModal(false);
    }
  };

  // 处理重新上传
  const handleReupload = () => {
    if (tempVideoUrl) {
      Modal.confirm({
        title: "重新上传",
        content: "确定要删除当前视频并重新上传吗？",
        okText: "确认",
        cancelText: "取消",
        onOk: async () => {
          // 保存当前URL，确保删除成功
          const urlToDelete = tempVideoUrl;
          const isEditingExistingVideo =
            isModal && tempVideoUrl === editData?.files?.[0];

          // 先清空状态，避免触发useEffect的清理函数
          setVideoUrl("");
          setVideoLoaded(false);
          setUploadedFileUrl(null);
          setSelectedVideoFile(null);
          setTempVideoUrl(null);

          // 删除会话存储
          sessionStorage.removeItem("tempVideoUpload");

          // 如果是编辑现有视频，不删除原始文件
          if (!isEditingExistingVideo) {
            // 最后再删除文件
            try {
              await deleteUploadedFile(urlToDelete);
              console.log("成功删除临时视频:", urlToDelete);
            } catch (error) {
              console.error("删除临时视频失败:", error);
            }
          } else {
            console.log("编辑模式：不删除原始视频文件，仅准备重新上传");
          }
        },
      });
    }
  };

  // 表情选择器内容（标题）
  const titleEmojiContent = (
    <div className={styles.emojiGrid}>
      {emojiList.map((emoji, index) => (
        <button
          key={index}
          className={styles.emojiItem}
          onClick={() => handleTitleEmojiSelect(emoji)}
        >
          {emoji}
        </button>
      ))}
    </div>
  );

  // 表情选择器内容（正文）
  const contentEmojiContent = (
    <div className={styles.emojiGrid}>
      {emojiList.map((emoji, index) => (
        <button
          key={index}
          className={styles.emojiItem}
          onClick={() => handleContentEmojiSelect(emoji)}
        >
          {emoji}
        </button>
      ))}
    </div>
  );

  // 已上传视频的预览区域渲染
  const renderUploadedVideo = () => {
    // 避免重复日志输出，使用useEffect或useRef记录第一次渲染
    if (!videoRef.current) {
      console.log("首次渲染视频播放器，URL:", videoUrl);
    }

    return (
      <>
        <div className={styles.videoPlayerContainer}>
          {/* 视频区域 */}
          <div className={styles.videoContentContainer}>
            <div className={styles.contentTitle}>
              <span>
                视频
                {videoDuration > 0 && (
                  <span className={styles.videoDuration}>
                    ({formatDuration(videoDuration)})
                  </span>
                )}
                {selectedVideoFile && (
                  <span className={styles.videoSize}>
                    {(selectedVideoFile.size / (1024 * 1024)).toFixed(1)} MB
                  </span>
                )}
              </span>
            </div>
            <div className={styles.videoControls}>
              <Button
                className={styles.controlButton}
                size="small"
                icon={<ReloadOutlined />}
                onClick={handleReupload}
                disabled={isUploading}
              >
                重新上传
              </Button>
            </div>

            <div style={{ position: "relative" }}>
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                crossOrigin="anonymous"
                className={styles.videoPlayer}
                onLoadedMetadata={handleVideoMetadataLoaded}
                onError={(e) => {
                  console.error("视频播放错误:", e);
                  console.error("视频URL:", videoUrl);
                  setVideoPreviewError(true);
                  message.error("视频播放失败，可能是因为跨域限制或视频不存在");
                }}
                preload="auto"
                onWaiting={() => console.log("视频缓冲中...")}
                onCanPlay={() => {
                  if (!videoLoaded) {
                    console.log("视频可以播放");
                    setVideoLoaded(true);
                  }
                }}
              />
              {!videoLoaded && (
                <div className={styles.videoLoadingOverlay}>
                  <Spin />
                  <p>加载中...</p>
                </div>
              )}
            </div>
          </div>

          {/* 添加封面预览和上传功能 */}
          <div className={styles.coverContentContainer}>
            <div className={styles.contentTitle}>视频封面</div>
            <div className={styles.coverControls}>
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={(file) => {
                  // 验证图片
                  if (file.size > 5 * 1024 * 1024) {
                    message.error("封面图片不能超过5MB");
                    return false;
                  }

                  if (!file.type.startsWith("image/")) {
                    message.error("只能上传图片作为封面");
                    return false;
                  }

                  // 创建安全文件名并上传
                  const secureFile = createSecureFile(file);
                  handleUploadCover(secureFile);
                  return false;
                }}
              >
                <Button
                  className={styles.controlButton}
                  size="small"
                  icon={<UploadOutlined />}
                >
                  更换封面
                </Button>
              </Upload>
            </div>

            <div className={styles.coverPreview}>
              {coverImageUrl ? (
                // 显示封面预览
                <div className={styles.coverImageContainer}>
                  <img
                    src={coverImageUrl}
                    alt="视频封面"
                    className={styles.coverImage}
                  />
                </div>
              ) : (
                // 显示上传按钮
                <div className={styles.coverUploadContainer}>
                  <p>视频将自动提取封面图片</p>
                  <p className={styles.coverTip}>
                    支持jpg、png格式，建议尺寸比例16:9
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  };

  // 添加上传封面图片的函数
  const handleUploadCover = async (file: File) => {
    try {
      message.loading("正在上传封面图片...", 0);

      // 上传图片
      const response = await uploadFile(file, "image", (percent) => {
        console.log("封面上传进度:", percent);
      });

      // 提取URL
      const imageUrl = extractImageUrl(response);
      if (imageUrl) {
        // 处理图片URL
        const processedImageUrl = imageUrl.startsWith("http")
          ? imageUrl
          : `http://localhost:8080${imageUrl}`;
        setCoverImageUrl(processedImageUrl);
        message.success("封面上传成功");
      } else {
        message.error("封面上传失败，无法获取URL");
      }
    } catch (error) {
      console.error("封面上传失败:", error);
      message.error("封面上传失败，请重试");
    } finally {
      message.destroy(); // 关闭所有消息
    }
  };

  // 上传中状态显示
  const renderUploadingState = () => {
    return (
      <>
        <div className={styles.videoPlayerContainer}>
          <div className={styles.videoContentContainer}>
            <div className={styles.contentTitle}>视频</div>
            <div className={styles.uploadProgressSection}>
              <div className={styles.coverPlaceholder}>
                <Progress type="circle" percent={uploadProgress} size={80} />
                <p className={styles.uploadingText}>
                  正在上传视频 ({uploadProgress}%)
                </p>
                <p className={styles.loadingText}>请耐心等待上传完成...</p>
              </div>
            </div>
          </div>

          <div className={styles.coverContentContainer}>
            <div className={styles.contentTitle}>视频封面</div>
            <div className={styles.coverPreview}>
              <div className={styles.coverPlaceholder}>
                <p>上传完成后可设置封面</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  // 视频加载错误状态显示
  const renderErrorState = () => {
    return (
      <>
        <div className={styles.videoInfoBar}>
          <div className={styles.videoInfoText}>
            <span>视频</span>
            {selectedVideoFile && (
              <span className={styles.videoSize}>
                {(selectedVideoFile.size / (1024 * 1024)).toFixed(1)} MB
              </span>
            )}
          </div>
        </div>
        <div className={styles.videoPlayerContainer}>
          <div className={styles.videoContentContainer}>
            <div className={styles.contentTitle}>视频</div>
            <div className={styles.videoControls}>
              <Button
                className={styles.controlButton}
                size="small"
                icon={<ReloadOutlined />}
                onClick={handleReupload}
                disabled={isUploading}
              >
                重新上传
              </Button>
            </div>
            <div className={styles.uploadProgressSection}>
              <div className={styles.coverPlaceholder}>
                <div style={{ textAlign: "center" }}>
                  <ReloadOutlined
                    className={styles.errorIcon}
                    style={{
                      fontSize: "48px",
                      color: "#ff4d4f",
                      marginBottom: "16px",
                    }}
                  />
                  <p
                    style={{
                      fontSize: "16px",
                      fontWeight: 500,
                      margin: "8px 0",
                    }}
                  >
                    视频加载失败
                  </p>
                  <p style={{ fontSize: "14px", color: "#888" }}>
                    请重新上传视频
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.coverContentContainer}>
            <div className={styles.contentTitle}>视频封面</div>
            <div className={styles.coverPreview}>
              <div className={styles.coverPlaceholder}>
                <p>视频加载失败</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  // 加载中状态显示
  const renderLoadingState = () => {
    return (
      <>
        <div className={styles.videoInfoBar}>
          <div className={styles.videoInfoText}>
            <span>视频</span>
            {selectedVideoFile && (
              <span className={styles.videoSize}>
                {(selectedVideoFile.size / (1024 * 1024)).toFixed(1)} MB
              </span>
            )}
          </div>
        </div>
        <div className={styles.videoPlayerContainer}>
          <div className={styles.videoContentContainer}>
            <div className={styles.contentTitle}>视频</div>
            <div className={styles.uploadProgressSection}>
              <div className={styles.coverPlaceholder}>
                <Spin
                  indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
                />
                <p className={styles.uploadingText}>视频加载中...</p>
                <p className={styles.loadingText}>正在处理视频，请稍候...</p>
              </div>
            </div>
          </div>

          <div className={styles.coverContentContainer}>
            <div className={styles.contentTitle}>视频封面</div>
            <div className={styles.coverPreview}>
              <div className={styles.coverPlaceholder}>
                <Spin size="small" />
                <p style={{ marginTop: "8px" }}>加载中...</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  // 空白状态（未选择视频）
  const renderEmptyState = () => {
    return (
      <>
        <div className={styles.videoInfoBar}>
          <div className={styles.videoInfoText}>
            <span>视频</span>
          </div>
        </div>
        <div className={styles.videoPlayerContainer}>
          <div className={styles.videoContentContainer}>
            <div className={styles.contentTitle}>视频</div>
            <div className={styles.videoUploadSection}>
              <Upload {...uploadProps} disabled={isUploading}>
                <div className={styles.uploadButton}>
                  <UploadOutlined className={styles.uploadIcon} />
                  <p>点击选择视频</p>
                  <p className={styles.uploadTip}>
                    支持mp4, webm, mov等格式，文件大小不超过100MB
                  </p>
                </div>
              </Upload>
            </div>
          </div>

          <div className={styles.coverContentContainer}>
            <div className={styles.contentTitle}>视频封面</div>
            <div className={styles.coverPreview}>
              <div className={styles.coverPlaceholder}>
                <p>上传视频后可设置封面</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  // 在Modal标题中显示编辑状态
  const modalTitle = editData
    ? actionType === "publish"
      ? "更新视频"
      : "保存草稿"
    : actionType === "publish"
    ? "发布视频"
    : "保存草稿";

  // 上传文件的属性
  const uploadProps: UploadProps = {
    beforeUpload: (file) => {
      // 简化日志输出
      console.log(
        `选择视频: ${file.name} (${Math.round(file.size / 1024 / 1024)}MB)`
      );

      // 检查是否已经在处理相同的文件
      if (isUploading) {
        console.log("上传任务正在进行中，请等待完成");
        return false;
      }

      // 检查是否重复文件
      if (
        selectedVideoFile &&
        selectedVideoFile.name === file.name &&
        selectedVideoFile.size === file.size &&
        selectedVideoFile.lastModified === file.lastModified
      ) {
        console.log("已选择相同的文件");
        return false;
      }

      // 如果有之前的上传，需要先清理
      if (tempVideoUrl) {
        Modal.confirm({
          title: "替换视频",
          content:
            "您已经上传了一个视频，是否确定要替换它？之前上传的视频将被删除。",
          okText: "确认替换",
          cancelText: "取消",
          onOk: async () => {
            // 保存当前URL并清除状态
            const urlToDelete = tempVideoUrl;
            setTempVideoUrl(null);
            sessionStorage.removeItem("tempVideoUpload");

            try {
              await deleteUploadedFile(urlToDelete);
              console.log("成功删除并替换临时视频:", urlToDelete);
              processNewVideo(file);
            } catch (error) {
              console.error("删除临时视频失败，但仍继续上传新视频:", error);
              processNewVideo(file);
            }
          },
        });
      } else {
        processNewVideo(file);
      }

      // 必须返回false阻止Upload组件默认的上传行为
      return false;
    },
    accept: "video/*",
    showUploadList: false,
    multiple: false, // 确保一次只能选择一个文件
    customRequest: () => {}, // 空的自定义请求函数，确保不会触发默认上传
  };

  // 取消发布或返回
  const handleCancel = () => {
    // 如果正在上传视频，不允许退出
    if (isUploading) {
      message.warning("视频正在上传中，请等待上传完成后再离开");
      return;
    }

    // 如果是编辑模式，直接返回，不删除视频
    if (isModal) {
      onBack();
      return;
    }

    // 如果已上传视频但未保存，需要删除
    if (tempVideoUrl) {
      Modal.confirm({
        title: "确认离开？",
        content: "您已上传视频但尚未发布，离开将会删除已上传的视频。",
        okText: "确认离开",
        cancelText: "继续编辑",
        onOk: async () => {
          // 保存当前URL并清除状态
          const urlToDelete = tempVideoUrl;
          setTempVideoUrl(null);

          try {
            await deleteUploadedFile(urlToDelete);
            console.log("成功删除临时视频:", urlToDelete);
          } catch (error) {
            console.error("删除临时视频失败:", error);
          }

          onBack();
        },
      });
    } else {
      onBack();
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.content}>
          {/* 仅在非弹窗模式下显示返回按钮 */}
          {!isModal && (
            <div className={styles.backButton}>
              <div
                className={styles.backIconWrapper}
                onClick={handleCancel}
                style={
                  isUploading ? { cursor: "not-allowed", opacity: 0.5 } : {}
                }
                title={
                  isUploading ? "视频上传中，请等待上传完成后再离开" : "返回"
                }
              >
                <LeftOutlined className={styles.backIcon} />
              </div>
              <span className={styles.pageTitle}>
                {editData ? "编辑视频" : "发布视频"}
              </span>
            </div>
          )}

          {/* 视频预览区域 */}
          <div className={styles.videoSection}>
            {isModal && videoUrl && !isUploading
              ? // 编辑模式且有视频URL，直接显示视频
                renderUploadedVideo()
              : !selectedVideoFile && !isUploading
              ? // 没有选择视频，显示上传按钮
                renderEmptyState()
              : isUploading
              ? // 上传中，显示进度
                renderUploadingState()
              : selectedVideoFile && videoUrl
              ? // 选择了视频且有URL，显示视频
                renderUploadedVideo()
              : videoPreviewError
              ? // 视频加载错误
                renderErrorState()
              : // 加载中
                renderLoadingState()}
          </div>

          <label className={styles.contentLabel}>添加标题</label>
          <div className={styles.titleInput}>
            <input
              type="text"
              placeholder="请输入标题，最多20个字"
              maxLength={20}
              value={title}
              onChange={handleTitleChange}
            />
            <span className={styles.titleCount}>{title.length}/20</span>

            {/* 标题的表情按钮 */}
            {typeof window !== "undefined" && (
              <div className={styles.titleEmojiButton}>
                <Popover
                  content={titleEmojiContent}
                  trigger="click"
                  placement="bottomRight"
                  overlayClassName={styles.emojiPopover}
                >
                  <button>
                    <SmileOutlined />
                  </button>
                </Popover>
              </div>
            )}
          </div>

          <label className={styles.contentLabel}>添加正文</label>
          <div className={styles.contentInput}>
            <textarea
              ref={contentInputRef}
              className={styles.contentTextarea}
              placeholder="添加正文内容，最多1000字"
              value={content}
              onChange={handleContentChange}
              maxLength={1000}
            />
            <span className={styles.contentCount}>{textLength}/1000</span>

            {/* 正文的表情按钮 */}
            {typeof window !== "undefined" && (
              <div className={styles.contentEmojiButton}>
                <Popover
                  content={contentEmojiContent}
                  trigger="click"
                  placement="bottomRight"
                  overlayClassName={styles.emojiPopover}
                >
                  <button>
                    <SmileOutlined />
                  </button>
                </Popover>
              </div>
            )}
          </div>

          <div className={styles.actionButtons}>
            <button
              className={styles.publishButton}
              onClick={handlePublish}
              disabled={
                !uploadedFileUrl ||
                !title ||
                !content ||
                isPublishing ||
                isUploading
              }
            >
              {isPublishing && actionType === "publish"
                ? editData
                  ? "更新中..."
                  : "发布中..."
                : editData
                ? "更新"
                : "发布"}
            </button>
            <button
              className={styles.draftButton}
              onClick={handleSaveDraft}
              disabled={
                !uploadedFileUrl ||
                !title ||
                !content ||
                isPublishing ||
                isUploading
              }
            >
              {isPublishing && actionType === "draft"
                ? "保存中..."
                : "保存草稿"}
            </button>
          </div>
        </div>
      </div>

      {/* 进度模态框 */}
      <Modal
        title={modalTitle}
        open={showPublishingModal}
        footer={null}
        closable={false}
        centered
        maskClosable={false}
        className={styles.publishingModal}
      >
        <div className={styles.publishingContent}>
          <Progress
            percent={publishProgress}
            status={publishProgress < 100 ? "active" : "success"}
          />
          <p className={styles.publishingText}>
            {publishProgress < 90
              ? actionType === "publish"
                ? "正在创建视频笔记..."
                : "正在保存草稿..."
              : actionType === "publish"
              ? "发布成功！"
              : "草稿保存成功！"}
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default PublishVideoPage;
