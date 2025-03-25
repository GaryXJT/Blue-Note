import React, { useState, useEffect } from 'react'
import { Modal, Form, Input, Button, Checkbox, message } from 'antd'
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons'
import styles from './LoginModal.module.scss'
import { useRouter } from 'next/router'
import { authAPI } from '@/api/services'
import useAuthStore from '@/store/useAuthStore'

interface LoginModalProps {
  visible: boolean
  onCancel: () => void
}

interface CaptchaData {
  captchaId: string
  captchaImage: string
}

const LoginModal: React.FC<LoginModalProps> = ({
  visible,
  onCancel,
}) => {
  const [form] = Form.useForm()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [captcha, setCaptcha] = useState<CaptchaData>({
    captchaId: '',
    captchaImage: ''
  })

  // 使用zustand auth store
  const login = useAuthStore(state => state.login)

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
      }
    } catch (error) {
      console.error('获取验证码失败:', error)
      message.error('获取验证码失败，请刷新重试')
    }
  }

  // 在弹窗显示时获取验证码
  useEffect(() => {
    if (visible) {
      fetchCaptcha()
      form.resetFields()
    }
  }, [visible, form])

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true)
      const { username, password, captcha: captchaCode } = values
      
      if (!captcha.captchaId) {
        message.error('验证码已失效，请刷新验证码')
        return
      }
      
      // 调用登录API
      const result = await authAPI.login({
        username,
        password,
        captchaId: captcha.captchaId,
        captchaCode
      })
      
      if (result.data) {
        // 使用zustand存储登录信息
        login(
          {
            userId: result.data.user_id,
            username: result.data.username,
            nickname: result.data.username, // 假设初始昵称与用户名相同
            avatar: '', // 默认头像
            bio: '',
            role: result.data.role as 'user' | 'admin',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }, 
          result.data.token
        )
        
        message.success('登录成功')
        onCancel()
        
        // 可以在登录成功后刷新或重定向
        if (router.pathname === '/') {
          window.location.reload()
        } else {
          router.push('/')
        }
      }
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
              prefix={<SafetyOutlined />}
              placeholder="请输入验证码"
              size="large"
            />
            <div className={styles.captchaImage} onClick={fetchCaptcha}>
              {captcha.captchaImage ? (
                <div dangerouslySetInnerHTML={{ __html: captcha.captchaImage }} />
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
          <span>新用户登录即自动注册</span>
        </div>
      </Form>
    </Modal>
  )
}

export default LoginModal
