import React, { useState } from 'react'
import { Modal, Form, Input, Button, Checkbox, message } from 'antd'
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import styles from './LoginModal.module.scss'
import { authAPI } from '@/api/services'

interface LoginModalProps {
  visible: boolean
  onClose: () => void
  onLogin: (username: string, password: string, captchaId: string, captchaCode: string) => void
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
  const [loading, setLoading] = useState(false)

  // 获取验证码
  const fetchCaptcha = async () => {
    try {
      // 调用验证码API
      const result = await authAPI.getCaptcha()
      if (result.data) {
        setCaptcha({
          captchaId: result.data.captcha_id,
          captchaImage: result.data.captcha_image
        })
        console.log(result.data)
      }
    } catch (error) {
      console.error('获取验证码失败:', error)
      message.error('获取验证码失败，请刷新重试')
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
      setLoading(true)
      const { username, password, captcha: captchaCode } = values
      
      if (!captcha.captchaId) {
        message.error('验证码已失效，请刷新验证码')
        return
      }
      
      // 调用父组件的登录方法
      await onLogin(username, password, captcha.captchaId, captchaCode)
      
      // 成功后重置表单
      form.resetFields()
      setLoading(false)
    } catch (error) {
      console.error('登录失败:', error)
      setLoading(false)
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
          <Button type="primary" htmlType="submit" block size="large" loading={loading}>
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
