import request from "../request";

// 获取总览数据
export const getOverviewStats = (params?: any) => {
  // 实际开发中替换为真实API
  // return request.get('/api/stats/overview', { params });

  // 模拟数据
  return Promise.resolve({
    data: {
      code: 200,
      message: "success",
      data: {
        totalUsers: 12580,
        newUsers: 358,
        newUsersGrowth: 12.5,
        totalPosts: 45678,
        newPosts: 1245,
        newPostsGrowth: 8.2,
        totalComments: 125890,
        newComments: 3450,
        newCommentsGrowth: 15.3,
        totalLikes: 348920,
        newLikes: 8734,
        newLikesGrowth: 21.7,
      },
    },
  });
};

// 获取用户增长数据
export const getUserGrowthStats = (params?: any) => {
  // 实际开发中替换为真实API
  // return request.get('/api/stats/user-growth', { params });

  // 模拟数据 - 过去30天的用户增长
  const generateUserData = () => {
    const data = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
      const newUsers = Math.floor(Math.random() * 100) + 50;
      const activeUsers = Math.floor(Math.random() * 1000) + 500;

      data.push({
        date: dateStr,
        newUsers,
        activeUsers,
      });
    }

    return data;
  };

  return Promise.resolve({
    data: {
      code: 200,
      message: "success",
      data: generateUserData(),
    },
  });
};

// 获取内容统计数据
export const getContentStats = (params?: any) => {
  // 实际开发中替换为真实API
  // return request.get('/api/stats/content', { params });

  // 模拟数据
  return Promise.resolve({
    data: {
      code: 200,
      message: "success",
      data: {
        // 内容分类统计
        categoryDistribution: [
          { name: "美食", value: 3250 },
          { name: "旅行", value: 2840 },
          { name: "穿搭", value: 2580 },
          { name: "数码", value: 1930 },
          { name: "健身", value: 1720 },
          { name: "读书", value: 1350 },
          { name: "宠物", value: 1280 },
          { name: "其他", value: 2450 },
        ],
        // 内容类型统计
        contentTypeDistribution: [
          { name: "图文", value: 75 },
          { name: "视频", value: 25 },
        ],
        // 每日发布趋势
        postTrend: (() => {
          const data = [];
          const now = new Date();

          for (let i = 14; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);

            const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
            const posts = Math.floor(Math.random() * 300) + 150;
            const videos = Math.floor(posts * 0.3);
            const images = posts - videos;

            data.push({
              date: dateStr,
              images,
              videos,
              total: posts,
            });
          }

          return data;
        })(),
      },
    },
  });
};

// 获取交互统计数据
export const getInteractionStats = (params?: any) => {
  // 实际开发中替换为真实API
  // return request.get('/api/stats/interaction', { params });

  // 模拟数据
  return Promise.resolve({
    data: {
      code: 200,
      message: "success",
      data: {
        // 用户交互数据
        interactionTrend: (() => {
          const data = [];
          const now = new Date();

          for (let i = 14; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);

            const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
            const likes = Math.floor(Math.random() * 2000) + 1000;
            const comments = Math.floor(Math.random() * 500) + 200;
            const shares = Math.floor(Math.random() * 300) + 100;

            data.push({
              date: dateStr,
              likes,
              comments,
              shares,
            });
          }

          return data;
        })(),
        // 热门内容排名(点赞最多)
        topLikedPosts: [
          {
            id: "post001",
            title: "这是我见过最好吃的日式拉面",
            likes: 12450,
            comments: 342,
            category: "美食",
          },
          {
            id: "post002",
            title: "春天穿搭必备单品推荐",
            likes: 10280,
            comments: 258,
            category: "穿搭",
          },
          {
            id: "post003",
            title: "三亚旅游攻略：隐藏景点大公开",
            likes: 9876,
            comments: 423,
            category: "旅行",
          },
          {
            id: "post004",
            title: "一周5分钟，养成马甲线",
            likes: 8765,
            comments: 267,
            category: "健身",
          },
          {
            id: "post005",
            title: "最新款手机深度评测",
            likes: 7654,
            comments: 189,
            category: "数码",
          },
        ],
        // 热门内容排名(评论最多)
        topCommentedPosts: [
          {
            id: "post010",
            title: "对于这个社会现象，你怎么看？",
            comments: 867,
            likes: 4532,
            category: "社会",
          },
          {
            id: "post011",
            title: "这个城市究竟有多少隐藏美食？",
            comments: 765,
            likes: 5421,
            category: "美食",
          },
          {
            id: "post012",
            title: "年轻人第一份工作该选什么？",
            comments: 721,
            likes: 3421,
            category: "职场",
          },
          {
            id: "post013",
            title: "养宠必看：这些东西千万别给猫咪吃",
            comments: 698,
            likes: 6543,
            category: "宠物",
          },
          {
            id: "post014",
            title: "关于最近的热门话题讨论",
            comments: 657,
            likes: 3987,
            category: "热点",
          },
        ],
      },
    },
  });
};

// 获取活跃地区数据
export const getRegionStats = () => {
  // 实际开发中替换为真实API
  // return request.get('/api/stats/region');

  // 模拟数据
  return Promise.resolve({
    data: {
      code: 200,
      message: "success",
      data: {
        regionDistribution: [
          { name: "北京", value: 15.2 },
          { name: "上海", value: 14.8 },
          { name: "广州", value: 9.6 },
          { name: "深圳", value: 8.9 },
          { name: "成都", value: 7.5 },
          { name: "杭州", value: 6.8 },
          { name: "武汉", value: 5.4 },
          { name: "西安", value: 4.8 },
          { name: "南京", value: 4.2 },
          { name: "重庆", value: 3.9 },
          { name: "其他", value: 18.9 },
        ],
      },
    },
  });
};

// 获取性别年龄分布数据
export const getDemographicStats = () => {
  // 实际开发中替换为真实API
  // return request.get('/api/stats/demographic');

  // 模拟数据
  return Promise.resolve({
    data: {
      code: 200,
      message: "success",
      data: {
        genderDistribution: [
          { name: "女性", value: 65 },
          { name: "男性", value: 35 },
        ],
        ageDistribution: [
          { name: "18岁以下", value: 8 },
          { name: "18-24岁", value: 30 },
          { name: "25-30岁", value: 28 },
          { name: "31-40岁", value: 20 },
          { name: "41-50岁", value: 10 },
          { name: "50岁以上", value: 4 },
        ],
      },
    },
  });
};
