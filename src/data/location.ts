export interface LocationOption {
  value: string;
  label: string;
  children?: LocationOption[];
}

export const provinceData: LocationOption[] = [
  {
    value: 'beijing',
    label: '北京',
  },
  {
    value: 'shanghai',
    label: '上海',
  },
  {
    value: 'guangdong',
    label: '广东',
    children: [
      {
        value: 'guangzhou',
        label: '广州',
      },
      {
        value: 'shenzhen',
        label: '深圳',
      },
    ],
  },
  {
    value: 'zhejiang',
    label: '浙江',
    children: [
      {
        value: 'hangzhou',
        label: '杭州',
      },
      {
        value: 'ningbo',
        label: '宁波',
      },
    ],
  },
  {
    value: 'jiangsu',
    label: '江苏',
    children: [
      {
        value: 'nanjing',
        label: '南京',
      },
      {
        value: 'suzhou',
        label: '苏州',
      },
    ],
  },
  {
    value: 'fujian',
    label: '福建',
    children: [
      {
        value: 'fuzhou',
        label: '福州',
      },
      {
        value: 'xiamen',
        label: '厦门',
      },
    ],
  },
  {
    value: 'henan',
    label: '河南',
    children: [
      {
        value: 'zhengzhou',
        label: '郑州',
      },
    ],
  },
  {
    value: 'hubei',
    label: '湖北',
    children: [
      {
        value: 'wuhan',
        label: '武汉',
      },
    ],
  },
  {
    value: 'sichuan',
    label: '四川',
    children: [
      {
        value: 'chengdu',
        label: '成都',
      },
    ],
  },
  // 可以继续添加更多省份和城市
]; 