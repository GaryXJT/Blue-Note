import React, { useState } from 'react'
import { Modal, Form, Input, Button, Checkbox } from 'antd'
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import styles from './LoginModal.module.scss'

interface LoginModalProps {
  visible: boolean
  onClose: () => void
  onLogin: (token: string, role: string) => void
}

interface CaptchaData {
  captchaId: string
  captchaImage: string
}

const LoginModal: React.FC<LoginModalProps> = ({
  visible,
  onClose,
  onLogin,
}) => {
  const [form] = Form.useForm()
  const [captcha, setCaptcha] = useState<CaptchaData>({
    captchaId: '',
    captchaImage: ''
  })

  // 获取验证码
  const fetchCaptcha = async () => {
    try {
      // 这里添加获取验证码的接口调用
      // const response = await api.getCaptcha()
      // setCaptcha(response)
      console.log('获取验证码')
    } catch (error) {
      console.error('获取验证码失败:', error)
    }
  }

  // 在弹窗显示时获取验证码
  React.useEffect(() => {
    if (visible) {
      fetchCaptcha()
    }
  }, [visible])

  const handleSubmit = async (values: any) => {
    try {
      // 这里添加实际的登录逻辑
      console.log('登录信息:', values)
      onLogin('dummy-token', 'user')
      form.resetFields()
      onClose()
    } catch (error) {
      console.error('登录失败:', error)
    }
  }

  return (
    <Modal
      title="账号登录"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={400}
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
          rules={[{ required: true, message: '请输入用户名' }]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="请输入用户名"
            size="large"
          />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[{ required: true, message: '请输入密码' }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="请输入密码"
            size="large"
          />
        </Form.Item>
        <Form.Item
          name="captcha"
          rules={[{ required: true, message: '请输入验证码' }]}
        >
          <div className={styles.captchaWrapper}>
            <Input
              prefix={<SafetyCertificateOutlined />}
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
                  : Promise.reject(new Error('请阅读并同意用户协议和隐私政策')),
            },
          ]}
        >
          <Checkbox>
            我已阅读并同意 <a href="#">《用户协议》</a>、<a href="#">《隐私政策》</a>
          </Checkbox>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" block size="large">
            登录
          </Button>
        </Form.Item>
        <div className={styles.register}>
          新用户可直接登录注册
        </div>
      </Form>
    </Modal>
  )
}

export default LoginModal
