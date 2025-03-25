import { Post } from '../types'

// 模拟标题
const mockTitles = [
  '把时间分给喜欢的人',
  '女孩结婚前一定要谈恋爱，否则后悔',
  '杨紫琼亲证婚讯，这张甜蜜床照',
  '想瘦大腿的姐妹看过来！可以开始瘦腿了',
  '老以为景德镇已经绝了，直到我去了上海...',
  '被这只鸭子治愈了',
  '这条裙子太美了，适合夏天穿',
  '后悔没早点知道这个化妆技巧！',
  '这家咖啡店也太好拍了吧',
  '周末和闺蜜的野餐日记'
]

// 模拟图片
const mockImages = [
  '/static/pic/post1.jpg',
  '/static/pic/post2.jpg',
  '/static/pic/post3.jpg',
  '/static/pic/post4.jpg',
  '/static/pic/post5.jpg',
  '/static/pic/post6.jpg'
]

// 生成随机段落文本
const generateParagraphs = (count: number) => {
  const lorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula. Sed auctor neque eu tellus rhoncus ut eleifend nibh porttitor. Ut in nulla enim. Phasellus molestie magna non est bibendum non venenatis nisl tempor. Suspendisse dictum feugiat nisl ut dapibus. Mauris iaculis porttitor posuere. Praesent id metus massa, ut blandit odio. Proin quis tortor orci. Etiam at risus et justo dignissim congue. Donec congue lacinia dui, a porttitor lectus condimentum laoreet.";
  
  const paragraphs = [];
  for (let i = 0; i < count; i++) {
    paragraphs.push(lorem);
  }
  
  return paragraphs.join('\n\n');
};

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
    const dimensions = generateImageDimensions();
    
    return {
      id: `post-${Date.now()}-${index}`,
      title: mockTitles[Math.floor(Math.random() * mockTitles.length)],
      content: generateParagraphs(2),
      summary: generateParagraphs(1).substring(0, 100),
      coverUrl: mockImages[Math.floor(Math.random() * mockImages.length)],
      width: dimensions.width,
      height: dimensions.height,
      images: [mockImages[Math.floor(Math.random() * mockImages.length)]],
      author: {
        id: `user-${index}`,
        name: `用户${index}`,
        avatar: '/static/pic/default-avatar.jpg'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['标签1', '标签2'],
      category: '分类1',
      likes: Math.floor(Math.random() * 2000),
      views: Math.floor(Math.random() * 5000),
      commentCount: Math.floor(Math.random() * 200)
    }
  })
}
