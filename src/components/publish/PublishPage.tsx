import React, { useState, useRef, useEffect } from "react";
import { message, Popover, Button, Modal, Progress } from "antd";
import { LeftOutlined, SmileOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd";
import ImageWall from "./ImageWall";
import styles from "./PublishPage.module.scss";
import {
  uploadFile,
  createPost,
  saveDraft,
  updatePost,
  deleteDraft,
} from "@/api/services/posts";
import { useRouter } from "next/router";
import { extractImageUrl, createSecureFile } from "@/utils/upload-helper";

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

interface PublishPageProps {
  initialImages: File[];
  onBack: () => void;
  onPublish?: () => void;
  editData?: any; // 添加编辑模式的数据
  type: "draft" | "post" | "update";
}

// 辅助函数：将 File[] 转换为 UploadFile[]
const convertFilesToUploadFiles = (files: File[] | undefined): UploadFile[] => {
  if (!files) return [];

  console.log("转换前的文件数量:", files.length);

  const result = files.map((file, index) => {
    const uploadFile: UploadFile = {
      uid: `-${Date.now()}-${index}-${Math.random()
        .toString(36)
        .substring(2, 9)}`,
      name: file.name,
      status: "done" as const,
      url: URL.createObjectURL(file),
      originFileObj: file as any,
      type: file.type,
      size: file.size,
    };
    return uploadFile;
  });

  console.log("转换后的文件:", result);
  return result;
};

const PublishPage: React.FC<PublishPageProps> = ({
  initialImages,
  onBack,
  onPublish,
  editData,
  type,
}) => {
  const router = useRouter();
  const [title, setTitle] = useState<string>(editData?.title || "");
  const [content, setContent] = useState<string>(editData?.content || "");
  const [textLength, setTextLength] = useState(editData?.content?.length || 0);
  const contentInputRef = useRef<HTMLTextAreaElement>(null);

  // 判断是否在弹窗中（编辑模式）
  const isModal = !!editData;

  // 初始化时处理编辑模式的图片
  const [imageFiles, setImageFiles] = useState<UploadFile[]>(() => {
    if (editData?.files?.length) {
      // 如果是编辑模式，将已有图片转换为UploadFile格式
      return editData.files.map((fileUrl: string, index: number) => ({
        uid: `-${Date.now()}-${index}`,
        name: `image-${index}.jpg`,
        status: "done",
        url: fileUrl,
        type: "image/jpeg",
      }));
    }
    return convertFilesToUploadFiles(initialImages);
  });

  const [isPublishing, setIsPublishing] = useState(false);
  const [showPublishingModal, setShowPublishingModal] = useState(false);
  const [publishProgress, setPublishProgress] = useState(0);
  // 用于标识当前操作是发布还是保存草稿
  const [actionType, setActionType] = useState<"publish" | "draft">("publish");

  // 如果是编辑模式，添加一个初始化useEffect
  useEffect(() => {
    if (editData) {
      console.log("编辑模式，加载现有数据:", editData);
      setTitle(editData.title || "");
      setContent(editData.content || "");
      setTextLength(editData.content?.length || 0);
    }
  }, [editData]);

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

  // 处理图片变化
  const handleImagesChange = (files: UploadFile[]) => {
    console.log("图片变化，新的图片列表:", files);

    // 确保所有文件都有originFileObj
    const validFiles = files.filter((file) => {
      const hasOriginFileObj = !!file.originFileObj;
      if (!hasOriginFileObj) {
        console.warn("发现没有originFileObj的文件:", file);
      }
      return hasOriginFileObj;
    });

    console.log("过滤后的有效图片:", validFiles);
    setImageFiles(validFiles);
  };

  // 处理清空图片
  const handleClearImages = () => {
    setImageFiles([]);
  };

  // 处理发布
  const handlePublish = async () => {
    if (imageFiles.length === 0) {
      message.error("请至少上传一张图片");
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
      setPublishProgress(0);

      // 1. 上传所有图片
      const imageUrls: string[] = [];

      // 找出需要上传的图片（检查originFileObj是否存在）
      const filesToUpload = imageFiles.filter((file) => file.originFileObj);

      // 将已有但不需要重新上传的图片URL加入到imageUrls
      imageFiles.forEach((file) => {
        if (file.url && !file.originFileObj) {
          imageUrls.push(file.url);
        }
      });

      if (filesToUpload.length === 0 && imageUrls.length === 0) {
        message.error("没有可上传的图片，请重新选择");
        setIsPublishing(false);
        setShowPublishingModal(false);
        return;
      }

      console.log("准备上传的图片数量:", filesToUpload.length);
      console.log("所有图片:", imageFiles);

      // 设置总进度的初始状态
      setPublishProgress(5); // 开始上传

      // 顺序上传图片，更新进度
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        if (file.originFileObj) {
          console.log(`开始上传第 ${i + 1} 张图片:`, file.name);

          // 更新上传进度
          const onProgress = (percent: number) => {
            // 计算总体进度：5% 开始 + 75% 用于上传图片 + 20% 用于创建帖子
            // 每张图片平均分配进度空间
            const uploadProgressWeight = 75 / filesToUpload.length;
            const currentFileProgress =
              5 +
              i * uploadProgressWeight +
              (percent * uploadProgressWeight) / 100;
            setPublishProgress(Math.floor(currentFileProgress));
          };

          try {
            // 创建安全文件名的文件对象
            const secureFile = createSecureFile(file.originFileObj);
            console.log(
              `原始文件名: ${file.originFileObj.name}, 安全文件名: ${secureFile.name}`
            );

            // 上传图片
            const response = await uploadFile(secureFile, "image", onProgress);
            console.log(`图片上传响应:`, response);

            // 使用辅助函数提取URL
            const imageUrl = extractImageUrl(response);
            if (imageUrl) {
              imageUrls.push(imageUrl);
              console.log(`第 ${i + 1} 张图片上传成功:`, imageUrl);
            } else {
              console.error(`无法从响应中获取URL:`, response);
              throw new Error("上传图片失败，无法获取URL");
            }
          } catch (error) {
            console.error(`第 ${i + 1} 张图片上传失败:`, error);
            message.error(`第 ${i + 1} 张图片上传失败，请重试`);
            setIsPublishing(false);
            setShowPublishingModal(false);
            return;
          }
        }
      }

      console.log("所有图片上传完成，URL列表:", imageUrls);

      // 设置进度为80%，表示图片上传完成，开始创建帖子
      setPublishProgress(80);

      // 2. 创建帖子或更新帖子
      const postData = {
        title,
        content,
        type: "image" as const,
        tags: [], // 暂不支持标签，但API需要这个字段
        files: imageUrls, // 根据API文档，这里应该是files而不是images
        isDraft: false, // 发布而非保存为草稿
      };

      let response;
      let publishedPostId = ""; // 用于存储发布成功后的帖子ID

      // 根据不同的type值执行不同的逻辑
      if (type === "update") {
        // 更新现有帖子
        console.log("准备更新帖子:", postData);
        if (editData && editData.id) {
          response = await updatePost(editData.id, postData);
          console.log("帖子更新成功:", response);
        } else {
          throw new Error("缺少帖子ID，无法更新");
        }
      } else if (type === "draft") {
        // 将草稿发布为正式帖子
        console.log("准备将草稿发布为正式帖子:", postData);
        response = await createPost(postData);
        console.log("草稿发布为正式帖子成功:", response);

        // 发布成功后，尝试删除原草稿
        if (editData && editData.id) {
          try {
            console.log("准备删除原草稿:", editData.id);
            await deleteDraft(editData.id);
            console.log("原草稿删除成功");
          } catch (deleteError) {
            console.error("删除原草稿失败:", deleteError);
            // 不中断流程，只记录错误
            message.warning("笔记已发布，但删除草稿失败");
          }
        }
      } else {
        // 创建新帖子
        console.log("准备创建新帖子:", postData);
        response = await createPost(postData);
        console.log("帖子创建成功:", response);
      }

      // 发布完成
      setPublishProgress(100);

      // 延迟关闭模态框，显示完成状态
      setTimeout(() => {
        setIsPublishing(false);
        setShowPublishingModal(false);

        if (type === "draft") {
          message.success("草稿发布成功");
        } else if (type === "update") {
          message.success("更新成功");
        } else {
          message.success("发布成功");
        }

        // 清空表单
        setTitle("");
        setContent("");
        setImageFiles([]);

        // 调用回调或重定向
        if (onPublish) {
          onPublish();
        } else {
          router.push("/"); // 默认返回首页
        }
      }, 1000);
    } catch (error) {
      console.error(
        type === "update" || type === "draft"
          ? "更新笔记失败:"
          : "发布笔记失败:",
        error
      );
      message.error(
        type === "update" || type === "draft"
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
    if (imageFiles.length === 0 && !title && !content) {
      message.warning("请至少添加标题、正文或图片");
      return;
    }

    try {
      setActionType("draft");
      setIsPublishing(true);
      setShowPublishingModal(true);
      setPublishProgress(0);

      // 1. 上传所有图片
      const imageUrls: string[] = [];

      // 找出需要上传的图片（只有originFileObj存在的文件需要上传）
      const filesToUpload = imageFiles.filter((file) => file.originFileObj);

      console.log("准备保存草稿，图片数量:", filesToUpload.length);

      // 如果有图片需要上传
      if (filesToUpload.length > 0) {
        // 设置总进度的初始状态
        setPublishProgress(5); // 开始上传

        // 顺序上传图片，更新进度
        for (let i = 0; i < filesToUpload.length; i++) {
          const file = filesToUpload[i];
          if (file.originFileObj) {
            console.log(`开始上传草稿图片 ${i + 1}:`, file.name);

            // 更新上传进度
            const onProgress = (percent: number) => {
              // 计算总体进度：5% 开始 + 75% 用于上传图片 + 20% 用于保存草稿
              // 每张图片平均分配进度空间
              const uploadProgressWeight = 75 / filesToUpload.length;
              const currentFileProgress =
                5 +
                i * uploadProgressWeight +
                (percent * uploadProgressWeight) / 100;
              setPublishProgress(Math.floor(currentFileProgress));
            };

            try {
              // 创建安全文件名的文件对象
              const secureFile = createSecureFile(file.originFileObj);
              console.log(
                `原始文件名: ${file.originFileObj.name}, 安全文件名: ${secureFile.name}`
              );

              // 上传图片
              const response = await uploadFile(
                secureFile,
                "image",
                onProgress
              );
              console.log(`草稿图片上传响应:`, response);

              // 使用辅助函数提取URL
              const imageUrl = extractImageUrl(response);
              if (imageUrl) {
                imageUrls.push(imageUrl);
                console.log(`草稿图片 ${i + 1} 上传成功:`, imageUrl);
              } else {
                console.error(`无法从响应中获取URL:`, response);
                throw new Error("上传图片失败，无法获取URL");
              }
            } catch (error) {
              console.error(`草稿图片 ${i + 1} 上传失败:`, error);
              message.error(`图片上传失败，请重试`);
              setIsPublishing(false);
              setShowPublishingModal(false);
              return;
            }
          }
        }
      }

      // 2. 创建草稿
      const draftData = {
        title,
        content,
        type: "image" as const,
        tags: [], // 暂不支持标签，但API需要这个字段
        files: imageUrls, // 根据API文档，这里应该是files而不是images
        isDraft: true, // 保存为草稿
      };

      console.log("准备保存草稿:", draftData);

      const response = await saveDraft(draftData);
      console.log("草稿保存成功:", response);

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
        setImageFiles([]);

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

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.content}>
          {/* 仅在非弹窗模式下显示返回按钮 */}
          {!isModal && (
            <div className={styles.backButton}>
              <div className={styles.backIconWrapper} onClick={onBack}>
                <LeftOutlined className={styles.backIcon} />
              </div>
              <span className={styles.pageTitle}>发布笔记</span>
            </div>
          )}

          {/* 图片上传区域 */}
          <div className={styles.imageSection}>
            <div className={styles.imageHeader}>
              <div className={styles.imageTitle}>
                <span>图片</span>
                <span className={styles.imageCounter}>
                  ({imageFiles.length}/9)
                </span>
              </div>
              {imageFiles.length > 0 && (
                <a className={styles.clearLink} onClick={handleClearImages}>
                  清空并重新上传
                </a>
              )}
            </div>
            <div className={styles.imageUploader}>
              <ImageWall
                files={imageFiles}
                onChange={handleImagesChange}
                onClear={handleClearImages}
              />
            </div>
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
                imageFiles.length === 0 || !title || !content || isPublishing
              }
            >
              {isPublishing && actionType === "publish" ? "发布中..." : "发布"}
            </button>
            <button
              className={styles.draftButton}
              onClick={handleSaveDraft}
              disabled={
                imageFiles.length === 0 || !title || !content || isPublishing
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
        title={actionType === "publish" ? "发布笔记" : "保存草稿"}
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
            {publishProgress < 30
              ? "正在上传图片..."
              : publishProgress < 80
              ? "图片上传中，请耐心等待..."
              : publishProgress < 100
              ? actionType === "publish"
                ? "正在创建笔记..."
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

export default PublishPage;
