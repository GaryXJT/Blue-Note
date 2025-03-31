import React, { useState } from "react";
import { Upload, message, Progress, Modal } from "antd";
import { PlusOutlined, CloseOutlined } from "@ant-design/icons";
import type { UploadFile, UploadProps } from "antd";
import styles from "./ImageWall.module.scss";

interface ImageWallProps {
  files: UploadFile[];
  onChange: (files: UploadFile[]) => void;
  onClear: () => void;
}

const ImageWall: React.FC<ImageWallProps> = ({ files, onChange, onClear }) => {
  // 处理图片上传
  const handleUpload: UploadProps["onChange"] = ({ fileList }) => {
    // 保留所有已有的文件，只需验证新添加的文件
    let validatedFiles = [...fileList];

    console.log("ImageWall 收到文件变更:", fileList.length, "个文件");

    // 如果这是一个添加新文件的操作
    if (fileList.length > files.length) {
      // 找出新添加的文件
      const newFiles = fileList.filter(
        (file) => !files.find((f) => f.uid === file.uid)
      );

      console.log("新添加的文件:", newFiles.length, "个");

      // 验证新添加的文件
      for (const file of newFiles) {
        // 检查文件类型
        const isImage = file.type && file.type.startsWith("image/");
        if (!isImage) {
          message.error("只能上传图片文件！");
          // 从验证后的文件列表中移除无效文件
          validatedFiles = validatedFiles.filter((f) => f.uid !== file.uid);
          continue;
        }

        // 检查文件大小（限制为5MB）
        const isLt5M = file.size ? file.size / 1024 / 1024 < 5 : true;
        if (!isLt5M) {
          message.error("图片大小不能超过5MB！");
          // 从验证后的文件列表中移除无效文件
          validatedFiles = validatedFiles.filter((f) => f.uid !== file.uid);
          continue;
        }

        console.log("文件验证通过:", file.name);
      }
    } else if (fileList.length < files.length) {
      console.log("文件被删除, 剩余文件:", fileList.length);
    }

    // 检查所有文件是否都有originFileObj
    validatedFiles.forEach((file, index) => {
      if (!file.originFileObj) {
        console.warn(`文件[${index}] ${file.name} 没有originFileObj`);
      } else {
        console.log(`文件[${index}] ${file.name} 有originFileObj`);
      }
    });

    onChange(validatedFiles);
  };

  // 处理图片删除
  const handleRemove = (file: UploadFile) => {
    console.log("删除文件:", file.name);
    const newFiles = files.filter((f) => f.uid !== file.uid);
    onChange(newFiles);
  };

  // 上传配置
  const uploadProps: UploadProps = {
    accept: "image/jpeg,image/png,image/gif,image/webp",
    listType: "picture-card",
    fileList: files,
    onChange: handleUpload,
    onRemove: handleRemove,
    maxCount: 9,
    multiple: true,
    beforeUpload: (file) => {
      console.log("beforeUpload 被调用:", file.name);
      // 在这里拦截文件上传，直接返回false表示不上传到服务器
      return false;
    },
  };

  return (
    <div className={styles.imageWall}>
      <Upload {...uploadProps}>
        <div>
          <PlusOutlined />
          <div style={{ marginTop: 8 }}>上传</div>
        </div>
      </Upload>
    </div>
  );
};
export default ImageWall;
