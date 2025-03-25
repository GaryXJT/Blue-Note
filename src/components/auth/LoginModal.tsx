import React, { useState, useEffect } from 'react'
import { Modal, Form, Input, Button, Checkbox, message } from 'antd'
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons'
import styles from './LoginModal.module.scss'
import { useRouter } from 'next/router'
import { authAPI } from '../../api/services'

interface LoginModalProps {
  visible: boolean
  onCancel: () => void
  onLoginSuccess: (token: string, userId: string) => void
}

const LoginModal: React.FC<LoginModalProps> = ({
  visible,
  onCancel,
  onLoginSuccess,
}) => {
  const [form] = Form.useForm()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [captchaInfo, setCaptchaInfo] = useState({
    captchaId: '',
    captchaImage: ''
  })

  // 获取验证码
  const fetchCaptcha = async () => {
    try {
      const response = await authAPI.getCaptcha()
      setCaptchaInfo({
        captchaId: response.data.captcha_id,
        captchaImage: response.data.captcha_image
      })
    } catch (error) {
      console.error('获取验证码失败:', error)
      message.error('获取验证码失败，请重试')
    }
  }

  // 当模态框显示时获取验证码
  useEffect(() => {
    if (visible) {
      fetchCaptcha()
      form.resetFields()
    }
  }, [visible, form])

  // 提交登录表单
  const handleSubmit = async (values: any) => {
    try {
      setLoading(true)
      const response = await authAPI.login({
        username: values.username,
        password: values.password,
        captchaId: captchaInfo.captchaId,
        captchaCode: values.captcha
      })
      
      message.success('登录成功')
      // 调用登录成功回调，传递token和userId
      onLoginSuccess(response.data.token, response.data.user_id)
      onCancel()
    } catch (error) {
      console.error('登录失败:', error)
      message.error('登录失败，请检查账号密码和验证码')
      // 刷新验证码
      fetchCaptcha()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title="账号登录"
      open={visible}
      onCancel={onCancel}
      footer={null}
      className={styles.loginModal}
      destroyOnClose
    >
      <Form
        form={form}
        name="login"
        className={styles.loginForm}
        onFinish={handleSubmit}
      >
        <Form.Item
          name="username"
          rules={[{ required: true, message: '请输入用户名' }]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="用户名"
            size="large"
          />
        </Form.Item>
        
        <Form.Item
          name="password"
          rules={[{ required: true, message: '请输入密码' }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="密码"
            size="large"
          />
        </Form.Item>
        
        <Form.Item
          name="captcha"
          rules={[{ required: true, message: '请输入验证码' }]}
        >
          <div className={styles.captchaWrapper}>
            <Input
              prefix={<SafetyOutlined />}
              placeholder="验证码"
              size="large"
            />
            {captchaInfo.captchaImage && (
              <img
                src={captchaInfo.captchaImage}
                alt="验证码"
                onClick={fetchCaptcha}
                className={styles.captchaImage}
              />
            )}
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
                  : Promise.reject(new Error('请同意用户协议和隐私政策')),
            },
          ]}
        >
          <Checkbox>
            我已阅读并同意 <a href="#" className={styles.agreementLink}>用户协议</a> 和 <a href="#" className={styles.agreementLink}>隐私政策</a>
          </Checkbox>
        </Form.Item>
        
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={loading}
          >
            登录
          </Button>
        </Form.Item>
        
        <div className={styles.registerPrompt}>
          还没有账号？<a href="#" onClick={() => router.push('/register')}>立即注册</a>
        </div>
      </Form>
    </Modal>
  )
}

export default LoginModal
