/**
 * 上传响应处理工具
 * 用于从不同格式的API响应中提取图片URL，以及处理文件名安全化
 */

/**
 * 从上传响应中提取图片URL
 * @param response 上传API的响应
 * @returns 图片URL或null（如果无法提取）
 */
export const extractImageUrl = (response: any): string | null => {
  console.log("处理上传响应:", JSON.stringify(response, null, 2));

  // 情况1: 标准API格式 {code: 0, data: {url: "..."}, message: "..."}
  if (
    response &&
    typeof response.code === "number" &&
    response.code === 0 &&
    response.data &&
    typeof response.data.url === "string"
  ) {
    console.log("从标准API格式提取URL:", response.data.url);
    return response.data.url;
  }

  // 情况2: 直接响应包含data.url {data: {url: "..."}}
  if (response && response.data && typeof response.data.url === "string") {
    console.log("从data.url格式提取URL:", response.data.url);
    return response.data.url;
  }

  // 情况3: 直接响应包含URL {url: "..."}
  if (response && typeof response.url === "string") {
    console.log("从url字段直接提取URL:", response.url);
    return response.url;
  }

  // 情况4: 复杂响应结构 {data: {data: {url: "..."}}}
  if (
    response &&
    response.data &&
    response.data.data &&
    typeof response.data.data.url === "string"
  ) {
    console.log("从嵌套data.data.url格式提取URL:", response.data.data.url);
    return response.data.data.url;
  }

  // 情况5: 响应中直接包含文件路径
  if (
    response &&
    typeof response === "string" &&
    (response.startsWith("http") || response.startsWith("/"))
  ) {
    console.log("从字符串直接提取URL:", response);
    return response;
  }

  // 检查更多可能的位置
  try {
    // 尝试递归搜索url字段
    const findUrl = (obj: any): string | null => {
      if (!obj || typeof obj !== "object") return null;

      if (typeof obj.url === "string") return obj.url;

      for (const key in obj) {
        if (typeof obj[key] === "object") {
          const result = findUrl(obj[key]);
          if (result) return result;
        }
      }

      return null;
    };

    const url = findUrl(response);
    if (url) {
      console.log("通过递归搜索找到URL:", url);
      return url;
    }
  } catch (e) {
    console.error("递归搜索URL时出错:", e);
  }

  console.error("无法从响应中提取URL:", response);
  return null;
};

/**
 * 生成安全的文件名
 * 格式: 原文件名的加密哈希-时间戳.扩展名
 *
 * @param originalName 原始文件名
 * @returns 处理后的安全文件名
 */
export const generateSecureFileName = (originalName: string): string => {
  // 提取文件扩展名
  const lastDotIndex = originalName.lastIndexOf(".");
  const extension =
    lastDotIndex !== -1 ? originalName.substring(lastDotIndex) : "";

  // 获取不带扩展名的文件名
  const nameWithoutExtension =
    lastDotIndex !== -1
      ? originalName.substring(0, lastDotIndex)
      : originalName;

  // 创建一个简单的散列值
  let hash = 0;
  for (let i = 0; i < nameWithoutExtension.length; i++) {
    hash = (hash << 5) - hash + nameWithoutExtension.charCodeAt(i);
    hash |= 0; // 转换为32位整数
  }
  // 转换为16进制并取绝对值以确保正数
  const hashedName = Math.abs(hash).toString(16).substring(0, 8);

  // 生成当前时间戳
  const timestamp = Date.now();

  // 组合成新的文件名: 哈希-时间戳.扩展名
  return `${hashedName}-${timestamp}${extension}`;
};

/**
 * 为文件对象创建一个新的文件，使用安全的文件名
 * 注意：此函数创建的是新的File对象，原始文件数据不变
 *
 * @param file 原始文件对象
 * @returns 具有安全文件名的新文件对象
 */
export const createSecureFile = (file: File): File => {
  const secureFileName = generateSecureFileName(file.name);

  // 创建一个新的文件对象，内容与原文件相同，但文件名不同
  return new File([file], secureFileName, {
    type: file.type,
    lastModified: file.lastModified,
  });
};

/**
 * 从视频中提取第一帧作为封面图片
 *
 * @param videoFile 视频文件或URL
 * @param format 输出图片格式，默认为'jpeg'
 * @param quality 图片质量(0-1)，默认为0.8
 * @returns Promise<Blob> 返回图片Blob对象
 */
export const extractVideoCover = (
  videoFile: File | string,
  format: "jpeg" | "png" = "jpeg",
  quality: number = 0.8
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      const video = document.createElement("video");
      video.crossOrigin = "anonymous"; // 处理跨域视频

      // 静音以避免任何可能的音频播放
      video.muted = true;
      video.autoplay = false;

      // 加载元数据后，设置到视频开始位置并提取帧
      video.onloadedmetadata = () => {
        // 设置到视频的开始，避免黑屏
        video.currentTime = 1; // 设置到1秒，通常会避开黑屏
      };

      // 当视频可以播放时，提取当前帧
      video.onseeked = () => {
        try {
          // 创建一个Canvas元素并设置适当的尺寸
          const canvas = document.createElement("canvas");
          // 设置一个合理的封面尺寸，例如16:9比例的480p
          canvas.width = 854;
          canvas.height = 480;

          // 获取Canvas上下文并绘制当前视频帧
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("无法获取Canvas上下文"));
            return;
          }

          // 在Canvas上绘制视频帧
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // 转换Canvas为Blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                // 清理资源
                video.pause();
                video.src = "";
                video.load();

                resolve(blob);
              } else {
                reject(new Error("无法从Canvas创建Blob"));
              }
            },
            `image/${format}`,
            quality
          );
        } catch (err) {
          reject(err);
        }
      };

      // 错误处理
      video.onerror = (e) => {
        reject(new Error(`视频加载失败: ${video.error?.message || e}`));
      };

      // 设置视频源
      if (typeof videoFile === "string") {
        // 如果是URL
        video.src = videoFile;
      } else {
        // 如果是File对象
        video.src = URL.createObjectURL(videoFile);
      }

      // 开始加载视频
      video.load();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * 将Blob转换为File对象
 *
 * @param blob Blob对象
 * @param fileName 文件名
 * @param mimeType MIME类型
 * @returns File对象
 */
export const blobToFile = (
  blob: Blob,
  fileName: string,
  mimeType?: string
): File => {
  const secureFileName = generateSecureFileName(fileName);
  return new File([blob], secureFileName, { type: mimeType || blob.type });
};
