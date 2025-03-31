import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Button, Checkbox, message } from "antd";
import { UserOutlined, LockOutlined, SafetyOutlined } from "@ant-design/icons";
import styles from "./LoginModal.module.scss";
import { useRouter } from "next/router";
import { authAPI, profileAPI } from "../../api/services";
import useAuthStore from "../../store/useAuthStore";

interface LoginModalProps {
  visible: boolean;
  onCancel: () => void;
}

interface CaptchaData {
  captchaId: string;
  captchaImage: string;
}

const LoginModal: React.FC<LoginModalProps> = ({ visible, onCancel }) => {
  const [form] = Form.useForm();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [captcha, setCaptcha] = useState<CaptchaData>({
    captchaId: "",
    captchaImage: "",
  });

  // 使用zustand状态管理
  const login = useAuthStore((state) => state.login);
  const updateUser = useAuthStore((state) => state.updateUser);

  // 获取验证码
  const fetchCaptcha = async () => {
    try {
      const response = await authAPI.getCaptcha();
      setCaptcha({
        captchaId: response.data.captcha_id,
        captchaImage: response.data.captcha_image,
      });
    } catch (error) {
      console.error("获取验证码失败:", error);
      message.error("获取验证码失败，请刷新重试");
    }
  };

  // 在弹窗显示时获取验证码
  useEffect(() => {
    if (visible) {
      fetchCaptcha();
      form.resetFields();
    }
  }, [visible, form]);

  // 获取用户详细资料（包括头像）
  const fetchUserProfile = async (userId: string) => {
    try {
      const response = await profileAPI.getUserProfile(userId);
      // 正确获取嵌套在response中的数据
      const profileData = (response.data as any)?.data;

      if (profileData) {
        // 更新用户头像和昵称等基本信息
        updateUser({
          avatar: profileData.avatar,
          nickname: profileData.nickname,
        });
      }
    } catch (error) {
      console.error("获取用户资料失败:", error);
      // 这里我们不显示错误提示，因为登录已经成功
      // 如果获取头像失败，界面将使用默认头像
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      const { username, password, captcha: captchaCode } = values;
      if (!captcha.captchaId) {
        message.error("验证码已失效，请刷新验证码");
        return;
      }

      const response = await authAPI.loginOrRegister({
        username,
        password,
        captchaId: captcha.captchaId,
        captchaCode,
      });

      if (response) {
        const userId = response.data.data.user_id;

        // 登录 - 存储基本用户信息
        login(
          {
            userId: userId,
            username: response.data.data.username,
            role: response.data.data.role,
          },
          response.data.data.token
        );

        // 获取更详细的用户信息（特别是头像）
        await fetchUserProfile(userId);

        // 根据后端返回的状态判断是新用户注册还是老用户登录
        if (response.data.code === 201) {
          // 假设 201 表示新用户注册
          message.success("注册成功并已自动登录");
        } else {
          message.success("登录成功");
        }

        onCancel(); // 关闭登录弹窗
      }
    } catch (error: any) {
      // 从错误对象中提取错误信息
      let errorMessage = "登录失败，请稍后再试";
      // 获取后端返回的错误消息
      if (error.response && error.response.data) {
        errorMessage = `登录失败，${
          error.response.data.message || "请检查账号密码和验证码"
        }`;
      } else if (error.message) {
        errorMessage = `登录失败，${error.message}`;
      }

      message.error(errorMessage);

      // 刷新验证码
      fetchCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="账号登录"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={420}
      className={styles.loginModal}
      centered
    >
      <Form
        form={form}
        onFinish={handleSubmit}
        layout="vertical"
        className={styles.loginForm}
      >
        <Form.Item
          name="username"
          rules={[{ required: true, message: "请输入用户名" }]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="请输入用户名"
            size="large"
          />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[{ required: true, message: "请输入密码" }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="请输入密码"
            size="large"
          />
        </Form.Item>
        <Form.Item
          name="captcha"
          rules={[{ required: true, message: "请输入验证码" }]}
        >
          <div className={styles.captchaWrapper}>
            <Input
              prefix={<SafetyOutlined />}
              placeholder="请输入验证码"
              size="large"
            />
            <div className={styles.captchaImage} onClick={fetchCaptcha}>
              {captcha.captchaImage ? (
                <img src={captcha.captchaImage} alt="验证码" />
              ) : (
                <div className={styles.captchaPlaceholder}>点击获取验证码</div>
              )}
            </div>
          </div>
        </Form.Item>
        <Form.Item
          name="agreement"
          valuePropName="checked"
          rules={[
            {
              validator: (_, value) =>
                value
                  ? Promise.resolve()
                  : Promise.reject(new Error("请阅读并同意用户协议和隐私政策")),
            },
          ]}
        >
          <Checkbox>
            我已阅读并同意 <a href="#">《用户协议》</a>、
            <a href="#">《隐私政策》</a>
          </Checkbox>
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={loading}
          >
            登录/注册
          </Button>
        </Form.Item>
        <div className={styles.register}>新用户可直接登录注册</div>
      </Form>
    </Modal>
  );
};

export default LoginModal;
