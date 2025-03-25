import React, { useEffect, useState } from 'react'
import { SyncOutlined } from '@ant-design/icons'
import styles from './Captcha.module.scss'

interface CaptchaProps {
  onChange: (captchaId: string, captchaCode: string) => void
}

interface CaptchaData {
  captchaId: string
  captchaImage: string
}

const Captcha: React.FC<CaptchaProps> = ({ onChange }) => {
  const [captchaData, setCaptchaData] = useState<CaptchaData | null>(null)
  const [captchaCode, setCaptchaCode] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchCaptcha = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/auth/captcha')
      const data = await response.json()
      
      if (data.code === 200 && data.data) {
        setCaptchaData(data.data)
        setCaptchaCode('') // 重置验证码输入
      }
    } catch (error) {
      console.error('获取验证码失败:', error)
      // 模拟数据，实际开发中应删除
      setCaptchaData({
        captchaId: Math.random().toString(36).substring(2, 10),
        captchaImage: 'data:image/png;base64,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'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCaptcha()
  }, [])

  useEffect(() => {
    if (captchaData && captchaCode) {
      onChange(captchaData.captchaId, captchaCode)
    }
  }, [captchaData, captchaCode, onChange])

  return (
    <div className={styles.captchaContainer}>
      <input
        type="text"
        className={styles.captchaInput}
        placeholder="验证码"
        value={captchaCode}
        onChange={(e) => {
          const value = e.target.value.toUpperCase()
          setCaptchaCode(value)
        }}
        maxLength={4}
      />
      <div className={styles.captchaWrapper}>
        {captchaData && (
          <img
            src={captchaData.captchaImage}
            alt="验证码"
            className={styles.captchaImage}
          />
        )}
        <button
          type="button"
          className={styles.refreshButton}
          onClick={fetchCaptcha}
          disabled={loading}>
          <SyncOutlined spin={loading} />
        </button>
      </div>
    </div>
  )
}

export default Captcha
