// 在生成帖子数据时添加宽高信息
const generateImageDimensions = () => {
  // 随机生成几种常见的图片比例
  const ratios = [
    { width: 800, height: 800 }, // 1:1
    { width: 800, height: 600 }, // 4:3
    { width: 900, height: 600 }, // 3:2
    { width: 1920, height: 1080 }, // 16:9
  ]

  return ratios[Math.floor(Math.random() * ratios.length)]
}

// 确保生成的帖子数据包含宽高信息
export const generateMockPosts = (count = 20): Post[] => {
  return Array.from({ length: count }).map((_, index) => {
    const dimensions = generateImageDimensions()

    return {
      id: `post-${Date.now()}-${index}`,
      title: `${mockTitles[Math.floor(Math.random() * mockTitles.length)]}`,
      content: generateParagraphs(2),
      summary: generateParagraphs(1).substring(0, 100),
      // ... existing code ...
      coverUrl: mockImages[Math.floor(Math.random() * mockImages.length)],
      width: dimensions.width,
      height: dimensions.height,
      // ... existing code ...
    }
  })
}
