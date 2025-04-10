import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Button,
  DatePicker,
  Tabs,
  Table,
  Progress,
  Tag,
  Card,
  Tooltip,
  Segmented,
} from "antd";
import {
  SyncOutlined,
  DownloadOutlined,
  UserOutlined,
  FileTextOutlined,
  CommentOutlined,
  LikeOutlined,
  RiseOutlined,
  PieChartOutlined,
  GlobalOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import ReactECharts from "echarts-for-react";
import StatCard from "./StatCard";
import ChartCard from "./ChartCard";
import TableCard from "./TableCard";
import styles from "./Stats.module.scss";

// 导入统计数据接口
import {
  getOverviewStats,
  getUserGrowthStats,
  getContentStats,
  getInteractionStats,
  getRegionStats,
  getDemographicStats,
} from "@/api/services/stats";

import type { ColumnsType } from "antd/es/table";

interface DataPoint {
  date: string;
  [key: string]: any;
}

interface Post {
  id: string;
  title: string;
  category: string;
  likes: number;
  comments: number;
}

const { RangePicker } = DatePicker;

const StatsPage: React.FC = () => {
  // 加载状态
  const [loading, setLoading] = useState({
    overview: true,
    userGrowth: true,
    content: true,
    interaction: true,
    region: true,
    demographic: true,
  });

  // 数据统计状态
  const [overviewStats, setOverviewStats] = useState<any>(null);
  const [userGrowthData, setUserGrowthData] = useState<DataPoint[]>([]);
  const [contentStats, setContentStats] = useState<any>(null);
  const [interactionStats, setInteractionStats] = useState<any>(null);
  const [regionStats, setRegionStats] = useState<any>(null);
  const [demographicStats, setDemographicStats] = useState<any>(null);

  // 图表切换状态
  const [userChartType, setUserChartType] = useState<"line" | "bar">("line");
  const [chartPeriod, setChartPeriod] = useState<"7d" | "15d" | "30d">("15d");

  // 获取总览数据
  const fetchOverviewStats = async () => {
    setLoading((prev) => ({ ...prev, overview: true }));
    try {
      const res = await getOverviewStats();
      if (res?.data?.code === 200) {
        setOverviewStats(res.data.data);
      }
    } catch (error) {
      console.error("获取总览数据失败:", error);
    } finally {
      setLoading((prev) => ({ ...prev, overview: false }));
    }
  };

  // 获取用户增长数据
  const fetchUserGrowthStats = async () => {
    setLoading((prev) => ({ ...prev, userGrowth: true }));
    try {
      const res = await getUserGrowthStats();
      if (res?.data?.code === 200) {
        const data = res.data.data;
        // 根据选定的周期过滤数据
        const filtered = filterDataByPeriod(data);
        setUserGrowthData(filtered);
      }
    } catch (error) {
      console.error("获取用户增长数据失败:", error);
    } finally {
      setLoading((prev) => ({ ...prev, userGrowth: false }));
    }
  };

  // 获取内容统计数据
  const fetchContentStats = async () => {
    setLoading((prev) => ({ ...prev, content: true }));
    try {
      const res = await getContentStats();
      if (res?.data?.code === 200) {
        setContentStats(res.data.data);
      }
    } catch (error) {
      console.error("获取内容统计数据失败:", error);
    } finally {
      setLoading((prev) => ({ ...prev, content: false }));
    }
  };

  // 获取交互统计数据
  const fetchInteractionStats = async () => {
    setLoading((prev) => ({ ...prev, interaction: true }));
    try {
      const res = await getInteractionStats();
      if (res?.data?.code === 200) {
        setInteractionStats(res.data.data);
      }
    } catch (error) {
      console.error("获取交互统计数据失败:", error);
    } finally {
      setLoading((prev) => ({ ...prev, interaction: false }));
    }
  };

  // 获取地区统计数据
  const fetchRegionStats = async () => {
    setLoading((prev) => ({ ...prev, region: true }));
    try {
      const res = await getRegionStats();
      if (res?.data?.code === 200) {
        setRegionStats(res.data.data);
      }
    } catch (error) {
      console.error("获取地区统计数据失败:", error);
    } finally {
      setLoading((prev) => ({ ...prev, region: false }));
    }
  };

  // 获取人口统计数据
  const fetchDemographicStats = async () => {
    setLoading((prev) => ({ ...prev, demographic: true }));
    try {
      const res = await getDemographicStats();
      if (res?.data?.code === 200) {
        setDemographicStats(res.data.data);
      }
    } catch (error) {
      console.error("获取人口统计数据失败:", error);
    } finally {
      setLoading((prev) => ({ ...prev, demographic: false }));
    }
  };

  // 根据周期过滤数据
  const filterDataByPeriod = (data: DataPoint[]) => {
    if (!data) return [];

    switch (chartPeriod) {
      case "7d":
        return data.slice(-7);
      case "15d":
        return data.slice(-15);
      case "30d":
        return data;
      default:
        return data;
    }
  };

  // 加载所有数据
  const loadAllData = () => {
    fetchOverviewStats();
    fetchUserGrowthStats();
    fetchContentStats();
    fetchInteractionStats();
    fetchRegionStats();
    fetchDemographicStats();
  };

  // 刷新数据
  const handleRefreshData = () => {
    loadAllData();
  };

  // 初始加载
  useEffect(() => {
    loadAllData();
  }, []);

  // 当图表周期变化时重新获取数据
  useEffect(() => {
    fetchUserGrowthStats();
  }, [chartPeriod]);

  // 渲染用户增长图表选项
  const userGrowthChartControls = (
    <div>
      <Segmented
        options={[
          {
            value: "line",
            icon: <RiseOutlined />,
          },
          {
            value: "bar",
            icon: <BarChartOutlined />,
          },
        ]}
        value={userChartType}
        onChange={(value) => setUserChartType(value as "line" | "bar")}
        style={{ marginRight: 16 }}
      />
      <Segmented
        options={[
          { label: "7天", value: "7d" },
          { label: "15天", value: "15d" },
          { label: "30天", value: "30d" },
        ]}
        value={chartPeriod}
        onChange={(value) => setChartPeriod(value as "7d" | "15d" | "30d")}
      />
    </div>
  );

  // 用户增长图表配置
  const getUserGrowthChartOption = () => {
    if (!userGrowthData.length) return {};

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
      },
      legend: {
        data: ["新增用户", "活跃用户"],
        bottom: 0,
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "10%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: userGrowthData.map((item) => item.date),
      },
      yAxis: [
        {
          type: "value",
          name: "新增用户",
          position: "left",
        },
        {
          type: "value",
          name: "活跃用户",
          position: "right",
        },
      ],
      series: [
        {
          name: "新增用户",
          type: userChartType,
          barWidth: 10,
          itemStyle: {
            color: "#1890ff",
          },
          yAxisIndex: 0,
          data: userGrowthData.map((item) => item.newUsers),
        },
        {
          name: "活跃用户",
          type: userChartType,
          barWidth: 10,
          itemStyle: {
            color: "#52c41a",
          },
          yAxisIndex: 1,
          data: userGrowthData.map((item) => item.activeUsers),
        },
      ],
    };
  };

  // 内容分类饼图配置
  const getCategoryPieOption = () => {
    if (!contentStats?.categoryDistribution) return {};

    return {
      tooltip: {
        trigger: "item",
        formatter: "{a} <br/>{b}: {c} ({d}%)",
      },
      legend: {
        orient: "vertical",
        right: 10,
        top: "center",
        data: contentStats.categoryDistribution.map((item: any) => item.name),
      },
      series: [
        {
          name: "内容分类",
          type: "pie",
          radius: ["40%", "70%"],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: "#fff",
            borderWidth: 2,
          },
          label: {
            show: false,
            position: "center",
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: "bold",
            },
          },
          labelLine: {
            show: false,
          },
          data: contentStats.categoryDistribution,
        },
      ],
    };
  };

  // 内容类型饼图配置
  const getContentTypePieOption = () => {
    if (!contentStats?.contentTypeDistribution) return {};

    return {
      tooltip: {
        trigger: "item",
        formatter: "{a} <br/>{b}: {c}%",
      },
      legend: {
        orient: "vertical",
        right: 10,
        top: "center",
        data: contentStats.contentTypeDistribution.map(
          (item: any) => item.name
        ),
      },
      series: [
        {
          name: "内容类型",
          type: "pie",
          radius: ["50%", "70%"],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: "#fff",
            borderWidth: 2,
          },
          label: {
            show: false,
            position: "center",
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: "bold",
            },
          },
          labelLine: {
            show: false,
          },
          data: contentStats.contentTypeDistribution,
        },
      ],
    };
  };

  // 交互趋势图表配置
  const getInteractionTrendOption = () => {
    if (!interactionStats?.interactionTrend) return {};

    const data = filterDataByPeriod(interactionStats.interactionTrend);

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "cross",
          label: {
            backgroundColor: "#6a7985",
          },
        },
      },
      legend: {
        data: ["点赞", "评论", "分享"],
        bottom: 0,
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "10%",
        containLabel: true,
      },
      xAxis: [
        {
          type: "category",
          boundaryGap: false,
          data: data.map((item: any) => item.date),
        },
      ],
      yAxis: [
        {
          type: "value",
        },
      ],
      series: [
        {
          name: "点赞",
          type: "line",
          stack: "Total",
          areaStyle: {},
          emphasis: {
            focus: "series",
          },
          data: data.map((item: any) => item.likes),
        },
        {
          name: "评论",
          type: "line",
          stack: "Total",
          areaStyle: {},
          emphasis: {
            focus: "series",
          },
          data: data.map((item: any) => item.comments),
        },
        {
          name: "分享",
          type: "line",
          stack: "Total",
          areaStyle: {},
          emphasis: {
            focus: "series",
          },
          data: data.map((item: any) => item.shares),
        },
      ],
    };
  };

  // 帖子发布趋势图表配置
  const getPostTrendOption = () => {
    if (!contentStats?.postTrend) return {};

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
      },
      legend: {
        data: ["图文", "视频", "总数"],
        bottom: 0,
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "10%",
        containLabel: true,
      },
      xAxis: [
        {
          type: "category",
          data: contentStats.postTrend.map((item: any) => item.date),
        },
      ],
      yAxis: [
        {
          type: "value",
        },
      ],
      series: [
        {
          name: "图文",
          type: "bar",
          stack: "Ad",
          emphasis: {
            focus: "series",
          },
          data: contentStats.postTrend.map((item: any) => item.images),
        },
        {
          name: "视频",
          type: "bar",
          stack: "Ad",
          emphasis: {
            focus: "series",
          },
          data: contentStats.postTrend.map((item: any) => item.videos),
        },
        {
          name: "总数",
          type: "line",
          emphasis: {
            focus: "series",
          },
          data: contentStats.postTrend.map((item: any) => item.total),
        },
      ],
    };
  };

  // 地区分布图表配置
  const getRegionDistributionOption = () => {
    if (!regionStats?.regionDistribution) return {};

    return {
      tooltip: {
        trigger: "item",
        formatter: "{a} <br/>{b}: {c}%",
      },
      series: [
        {
          name: "用户地区分布",
          type: "pie",
          radius: "60%",
          center: ["50%", "50%"],
          data: regionStats.regionDistribution,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
        },
      ],
    };
  };

  // 性别分布图表配置
  const getGenderDistributionOption = () => {
    if (!demographicStats?.genderDistribution) return {};

    return {
      tooltip: {
        trigger: "item",
        formatter: "{a} <br/>{b}: {c}%",
      },
      color: ["#ff7a45", "#1890ff"],
      series: [
        {
          name: "用户性别分布",
          type: "pie",
          radius: ["50%", "70%"],
          avoidLabelOverlap: false,
          label: {
            show: false,
            position: "center",
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 20,
              fontWeight: "bold",
            },
          },
          labelLine: {
            show: false,
          },
          data: demographicStats.genderDistribution,
        },
      ],
    };
  };

  // 年龄分布图表配置
  const getAgeDistributionOption = () => {
    if (!demographicStats?.ageDistribution) return {};

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "8%",
        top: "3%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: demographicStats.ageDistribution.map((item: any) => item.name),
      },
      yAxis: {
        type: "value",
        axisLabel: {
          formatter: "{value}%",
        },
      },
      series: [
        {
          name: "用户年龄分布",
          type: "bar",
          barWidth: "60%",
          data: demographicStats.ageDistribution.map((item: any) => item.value),
        },
      ],
    };
  };

  // 热门内容表格列定义
  const topPostColumns: ColumnsType<Post> = [
    {
      title: "排名",
      key: "rank",
      width: 80,
      render: (_, __, index) => index + 1,
    },
    {
      title: "标题",
      dataIndex: "title",
      key: "title",
      ellipsis: {
        showTitle: false,
      },
      render: (title) => (
        <Tooltip placement="topLeft" title={title}>
          {title}
        </Tooltip>
      ),
    },
    {
      title: "分类",
      dataIndex: "category",
      key: "category",
      width: 90,
      render: (category) => (
        <Tag color="blue" className={styles.tableTag}>
          {category}
        </Tag>
      ),
    },
    {
      title: "点赞数",
      dataIndex: "likes",
      key: "likes",
      width: 100,
      sorter: (a, b) => a.likes - b.likes,
      render: (likes) => <span style={{ color: "#f5222d" }}>{likes}</span>,
    },
    {
      title: "评论数",
      dataIndex: "comments",
      key: "comments",
      width: 100,
      sorter: (a, b) => a.comments - b.comments,
      render: (comments) => (
        <span style={{ color: "#1890ff" }}>{comments}</span>
      ),
    },
  ];

  return (
    <div className={styles.statsPageWrapper}>
      <div className={styles.statsPageHeader}>
        <h1>数据统计</h1>
        <div className={styles.statsToolbar}>
          <RangePicker style={{ width: 240 }} />
          <Button icon={<SyncOutlined />} onClick={handleRefreshData}>
            刷新数据
          </Button>
          <Button type="primary" icon={<DownloadOutlined />}>
            导出报表
          </Button>
        </div>
      </div>

      {/* 数据概览部分 */}
      <section className={styles.statsOverview}>
        <div className={styles.statsGrid}>
          <StatCard
            title="总用户数"
            value={overviewStats?.totalUsers || 0}
            growth={overviewStats?.newUsersGrowth}
            icon={<UserOutlined />}
            loading={loading.overview}
            tooltip="平台上的所有注册用户总数"
          />
          <StatCard
            title="总笔记数"
            value={overviewStats?.totalPosts || 0}
            growth={overviewStats?.newPostsGrowth}
            icon={<FileTextOutlined />}
            loading={loading.overview}
            tooltip="所有用户发布的笔记总数"
          />
          <StatCard
            title="总评论数"
            value={overviewStats?.totalComments || 0}
            growth={overviewStats?.newCommentsGrowth}
            icon={<CommentOutlined />}
            loading={loading.overview}
            tooltip="所有笔记下的评论总数"
          />
          <StatCard
            title="总点赞数"
            value={overviewStats?.totalLikes || 0}
            growth={overviewStats?.newLikesGrowth}
            icon={<LikeOutlined />}
            loading={loading.overview}
            tooltip="所有笔记获得的点赞总数"
          />
        </div>
      </section>

      {/* 用户增长图表 */}
      <section>
        <ChartCard
          title="用户增长趋势"
          controls={userGrowthChartControls}
          loading={loading.userGrowth}
          empty={!userGrowthData.length}
        >
          <ReactECharts
            option={getUserGrowthChartOption()}
            style={{ height: "100%", width: "100%" }}
            notMerge={true}
          />
        </ChartCard>
      </section>

      {/* 内容分析部分 */}
      <section>
        <Row gutter={24}>
          <Col span={12}>
            <ChartCard
              title="内容发布趋势"
              loading={loading.content}
              empty={!contentStats?.postTrend}
            >
              <ReactECharts
                option={getPostTrendOption()}
                style={{ height: "100%", width: "100%" }}
                notMerge={true}
              />
            </ChartCard>
          </Col>
          <Col span={12}>
            <ChartCard
              title="交互数据趋势"
              loading={loading.interaction}
              empty={!interactionStats?.interactionTrend}
            >
              <ReactECharts
                option={getInteractionTrendOption()}
                style={{ height: "100%", width: "100%" }}
                notMerge={true}
              />
            </ChartCard>
          </Col>
        </Row>
      </section>

      {/* 内容分类分析 */}
      <section>
        <Row gutter={24}>
          <Col span={12}>
            <ChartCard
              title="内容分类分布"
              loading={loading.content}
              empty={!contentStats?.categoryDistribution}
            >
              <ReactECharts
                option={getCategoryPieOption()}
                style={{ height: "100%", width: "100%" }}
                notMerge={true}
              />
            </ChartCard>
          </Col>
          <Col span={12}>
            <ChartCard
              title="内容类型分布"
              loading={loading.content}
              empty={!contentStats?.contentTypeDistribution}
            >
              <ReactECharts
                option={getContentTypePieOption()}
                style={{ height: "100%", width: "100%" }}
                notMerge={true}
              />
            </ChartCard>
          </Col>
        </Row>
      </section>

      {/* 用户画像分析 */}
      <section>
        <Row gutter={24}>
          <Col span={8}>
            <ChartCard
              title="用户性别分布"
              loading={loading.demographic}
              empty={!demographicStats?.genderDistribution}
            >
              <ReactECharts
                option={getGenderDistributionOption()}
                style={{ height: "100%", width: "100%" }}
                notMerge={true}
              />
            </ChartCard>
          </Col>
          <Col span={8}>
            <ChartCard
              title="用户年龄分布"
              loading={loading.demographic}
              empty={!demographicStats?.ageDistribution}
            >
              <ReactECharts
                option={getAgeDistributionOption()}
                style={{ height: "100%", width: "100%" }}
                notMerge={true}
              />
            </ChartCard>
          </Col>
          <Col span={8}>
            <ChartCard
              title="用户地区分布"
              loading={loading.region}
              empty={!regionStats?.regionDistribution}
            >
              <ReactECharts
                option={getRegionDistributionOption()}
                style={{ height: "100%", width: "100%" }}
                notMerge={true}
              />
            </ChartCard>
          </Col>
        </Row>
      </section>

      {/* 热门内容排行 */}
      <section>
        <Row gutter={24}>
          <Col span={12}>
            <TableCard
              title="点赞最多的内容"
              loading={loading.interaction}
              empty={!interactionStats?.topLikedPosts?.length}
            >
              <Table
                columns={topPostColumns}
                dataSource={interactionStats?.topLikedPosts || []}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </TableCard>
          </Col>
          <Col span={12}>
            <TableCard
              title="评论最多的内容"
              loading={loading.interaction}
              empty={!interactionStats?.topCommentedPosts?.length}
            >
              <Table
                columns={topPostColumns}
                dataSource={interactionStats?.topCommentedPosts || []}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </TableCard>
          </Col>
        </Row>
      </section>
    </div>
  );
};

export default StatsPage;
