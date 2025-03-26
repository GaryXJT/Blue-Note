import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Cascader,
  message,
  Upload,
} from "antd";
import {
  PlusOutlined,
  LoadingOutlined,
  DeleteOutlined,
  SmileOutlined,
  CoffeeOutlined,
  MehOutlined,
  RocketOutlined,
  FrownOutlined,
  ExclamationCircleOutlined,
  HeartOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  BulbOutlined,
} from "@ant-design/icons";
import type { UploadFile, UploadProps } from "antd/es/upload/interface";
import dayjs from "dayjs";
import useAuthStore from "@/store/useAuthStore";
import styles from "./EditProfileModal.module.scss";
import { provinceData } from "@/data/location"; // 我们需要创建这个文件
import { profileAPI } from "@/api/services"; // 导入新的profile API
import { ApiResponse } from "@/api/axios"; // 导入API响应类型

const { Option } = Select;
const { TextArea } = Input;

interface EditProfileModalProps {
  visible: boolean;
  onCancel: () => void;
  userInfo: {
    username: string;
    avatar: string;
    nickname: string;
    accountId: string;
    bio?: string;
    gender?: string;
    birthday?: string;
    location?: string;
    status?: string;
  };
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onCancel,
  userInfo,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // 添加状态来跟踪输入字段的字符数
  const [usernameLength, setUsernameLength] = useState(0);
  const [nicknameLength, setNicknameLength] = useState(0);
  const [bioLength, setBioLength] = useState(0);

  const updateUser = useAuthStore((state) => state.updateUser);

  // 初始化文件列表
  useEffect(() => {
    if (visible && userInfo.avatar) {
      setFileList(
        userInfo.avatar
          ? [
              {
                uid: "-1",
                name: "avatar.png",
                status: "done",
                url: userInfo.avatar,
              },
            ]
          : [] // 如果没有头像，则使用空数组，后端会返回默认头像
      );
    } else {
      setFileList([]);
    }
  }, [visible, userInfo.avatar]);

  // 处理图片上传
  const handleUpload: UploadProps["onChange"] = ({ fileList }) => {
    // 检查文件类型
    const newFiles = fileList.filter((file) => {
      // 添加类型检查，确保file.type存在
      const isImage = file.type && file.type.startsWith("image/");
      if (!isImage && file.originFileObj) {
        message.error("只能上传图片文件！");
        return false;
      }
      return true;
    });

    // 检查文件大小（限制为2MB）
    const validFiles = newFiles.filter((file) => {
      // 添加文件大小检查，确保file.size存在
      const isLt2M = file.size ? file.size / 1024 / 1024 < 2 : true;
      if (!isLt2M && file.originFileObj) {
        message.error("图片大小不能超过2MB！");
        return false;
      }
      return true;
    });

    setFileList(validFiles);
  };

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // 格式化生日
      let formattedValues = { ...values };
      if (values.birthday) {
        formattedValues.birthday = values.birthday.format("YYYY-MM-DD");
      }

      // 格式化籍贯
      if (values.location && values.location.length) {
        formattedValues.location = values.location.join(" ");
      }

      // 处理头像上传
      try {
        if (fileList.length > 0 && fileList[0].originFileObj) {
          // 如果有新上传的文件，先上传头像
          const avatarResponse = await profileAPI.uploadAvatar(
            fileList[0].originFileObj
          );
          // 安全地获取avatarUrl
          const avatarUrl = (avatarResponse.data as any)?.data?.avatarUrl || "";
          formattedValues.avatar = avatarUrl;
        } else if (fileList.length > 0) {
          // 使用现有头像
          formattedValues.avatar = fileList[0].url;
        } else {
          // 空头像，使用默认头像
          formattedValues.avatar = "";
        }

        // 更新用户资料
        const updateResponse = await profileAPI.updateUserProfile(
          formattedValues
        );
        // 安全地解析用户数据
        const userData = (updateResponse.data as any)?.data || {};

        // 更新用户信息到 Zustand store
        updateUser({
          username: userData.username,
          nickname: userData.nickname,
          avatar: userData.avatar,
          bio: userData.bio,
          gender: userData.gender,
          birthday: userData.birthday,
          location: userData.location,
          status: userData.status,
        });

        message.success("资料更新成功");
        onCancel();
      } catch (error: any) {
        console.error("API调用失败:", error);
        message.error(error.response?.data?.message || "保存失败，请稍后再试");
      }
    } catch (validationError) {
      console.error("表单验证失败:", validationError);
      message.error("请检查表单填写是否正确");
    } finally {
      setLoading(false);
    }
  };

  // 重置表单
  const handleCancel = () => {
    form.resetFields();
    setFileList(
      userInfo.avatar
        ? [
            {
              uid: "-1",
              name: "avatar.png",
              status: "done",
              url: userInfo.avatar,
            },
          ]
        : []
    );
    setUsernameLength(0);
    setNicknameLength(0);
    setBioLength(0);
    onCancel();
  };

  // 解析位置字符串为数组
  const parseLocation = (locationStr?: string) => {
    if (!locationStr) return undefined;
    return locationStr.split(" ");
  };

  // 上传配置
  const uploadProps: UploadProps = {
    accept: "image/*",
    listType: "picture-circle",
    fileList: fileList,
    onChange: handleUpload,
    maxCount: 1,
    beforeUpload: () => {
      // 在这里拦截文件上传，直接返回false表示不上传到服务器
      return false;
    },
  };

  return (
    <Modal
      title="编辑个人资料"
      open={visible}
      onCancel={handleCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="保存"
      cancelText="取消"
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          username: userInfo.username,
          nickname: userInfo.nickname,
          bio: userInfo.bio || "认真吃饭",
          gender: userInfo.gender || "female",
          birthday: userInfo.birthday ? dayjs(userInfo.birthday) : undefined,
          location: parseLocation(userInfo.location),
          status: userInfo.status || "happy",
        }}
        className={styles.editForm}
      >
        <div className={styles.avatarUpload}>
          <Upload {...uploadProps}>
            {fileList.length === 0 && (
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>上传头像</div>
              </div>
            )}
          </Upload>
          <p className={styles.avatarTip}>点击更换头像</p>
        </div>

        <Form.Item
          name="username"
          label={
            <span>
              小蓝书号{" "}
              <span className={styles.charCount}>({usernameLength}/16)</span>
            </span>
          }
          rules={[
            { required: true, message: "请输入小蓝书号" },
            {
              pattern: /^[a-zA-Z0-9_-]{4,16}$/,
              message: "小蓝书号只能包含字母、数字、下划线和连字符，长度4-16位",
            },
          ]}
        >
          <Input
            placeholder="请输入小蓝书号"
            maxLength={16}
            onChange={(e) => setUsernameLength(e.target.value.length)}
          />
        </Form.Item>

        <Form.Item
          name="nickname"
          label={
            <span>
              昵称{" "}
              <span className={styles.charCount}>({nicknameLength}/20)</span>
            </span>
          }
          rules={[{ required: true, message: "请输入昵称" }]}
        >
          <Input
            placeholder="请输入昵称"
            maxLength={20}
            onChange={(e) => setNicknameLength(e.target.value.length)}
          />
        </Form.Item>

        <Form.Item
          name="bio"
          label={
            <span>
              个人简介{" "}
              <span className={styles.charCount}>({bioLength}/100)</span>
            </span>
          }
        >
          <TextArea
            placeholder="介绍一下自己吧"
            maxLength={100}
            autoSize={{ minRows: 2, maxRows: 4 }}
            onChange={(e) => setBioLength(e.target.value.length)}
          />
        </Form.Item>

        <Form.Item name="gender" label="性别">
          <Select placeholder="请选择性别">
            <Option value="male">男</Option>
            <Option value="female">女</Option>
            <Option value="other">沃尔玛塑料袋</Option>
          </Select>
        </Form.Item>

        <Form.Item name="birthday" label="生日">
          <DatePicker placeholder="请选择生日" style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item name="location" label="籍贯">
          <Cascader
            options={provinceData}
            placeholder="请选择省份城市"
            showSearch={{
              filter: (inputValue, path) =>
                path.some(
                  (option) =>
                    option.label
                      .toLowerCase()
                      .indexOf(inputValue.toLowerCase()) > -1
                ),
            }}
          />
        </Form.Item>

        <Form.Item name="status" label="状态">
          <Select placeholder="请选择状态">
            <Option value="happy">
              <SmileOutlined /> 开心
            </Option>
            <Option value="relaxed">
              <CoffeeOutlined /> 慵懒
            </Option>
            <Option value="bored">
              <MehOutlined /> 无聊
            </Option>
            <Option value="excited">
              <RocketOutlined /> 兴奋
            </Option>
            <Option value="sad">
              <FrownOutlined /> 难过
            </Option>
            <Option value="anxious">
              <ExclamationCircleOutlined /> 焦虑
            </Option>
            <Option value="peaceful">
              <HeartOutlined /> 平静
            </Option>
            <Option value="energetic">
              <ThunderboltOutlined /> 甲亢
            </Option>
            <Option value="tired">
              <ClockCircleOutlined /> 疲惫
            </Option>
            <Option value="thinking">
              <BulbOutlined /> 沉思
            </Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditProfileModal;
