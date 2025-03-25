import React, { useState, useEffect } from 'react'
import { Card, Avatar, Form, Input, Button, Upload, message, Spin } from 'antd'
import { UserOutlined, EditOutlined, UploadOutlined } from '@ant-design/icons'
import { userAPI, uploadAPI } from '../../services/api'
import type { User } from '../../types/api'
import styles from './index.module.scss'

const ProfilePage: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [userInfo, setUserInfo] = useState<User | null>(null)
  const [editing, setEditing] = useState(false)

  // 获取用户信息
  const fetchUserInfo = async () => {
    try {
      const data = await userAPI.getProfile()
      setUserInfo(data)
      form.setFieldsValue({
        nickname: data.nickname,
        bio: data.bio,
      })
    } catch (error) {
      message.error('获取用户信息失败')
    }
  }

  useEffect(() => {
    fetchUserInfo()
  }, [])

  // 处理头像上传
  const handleAvatarUpload = async (file: File) => {
    try {
      const { url } = await uploadAPI.uploadFile(file)
      await userAPI.updateProfile({ avatar: url })
      setUserInfo((prev) => (prev ? { ...prev, avatar: url } : null))
      message.success('头像更新成功')
      return false
    } catch (error) {
      message.error('头像上传失败')
      return false
    }
  }

  // 处理表单提交
  const handleSubmit = async (values: { nickname: string; bio: string }) => {
    setLoading(true)
    try {
      const data = await userAPI.updateProfile(values)
      setUserInfo(data)
      setEditing(false)
      message.success('个人信息更新成功')
    } catch (error) {
      // 错误已在request.ts中统一处理
    } finally {
      setLoading(false)
    }
  }

  if (!userInfo) {
    return (
      <div className={styles.loading}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <Card className={styles.profileCard}>
        <div className={styles.header}>
          <div className={styles.avatarSection}>
            <Avatar size={120} src={userInfo.avatar} icon={<UserOutlined />} />
            <Upload
              showUploadList={false}
              beforeUpload={handleAvatarUpload}
              accept="image/*">
              <Button icon={<UploadOutlined />} className={styles.uploadBtn}>
                更换头像
              </Button>
            </Upload>
          </div>
          <div className={styles.userInfo}>
            <h2>{userInfo.username}</h2>
            <p>注册时间：{new Date(userInfo.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          disabled={!editing}>
          <Form.Item
            name="nickname"
            label="昵称"
            rules={[
              { required: true, message: '请输入昵称' },
              { max: 32, message: '昵称最多32个字符' },
            ]}>
            <Input placeholder="请输入昵称" />
          </Form.Item>

          <Form.Item
            name="bio"
            label="个人简介"
            rules={[{ max: 200, message: '个人简介最多200个字符' }]}>
            <Input.TextArea placeholder="请输入个人简介" rows={4} />
          </Form.Item>

          <Form.Item>
            {editing ? (
              <div className={styles.buttonGroup}>
                <Button type="primary" htmlType="submit" loading={loading}>
                  保存
                </Button>
                <Button onClick={() => setEditing(false)}>取消</Button>
              </div>
            ) : (
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => setEditing(true)}>
                编辑资料
              </Button>
            )}
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default ProfilePage
