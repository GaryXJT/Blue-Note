import React, { useState, useEffect } from 'react'
import { Card, Avatar, Form, Input, Button, Upload, message, Spin } from 'antd'
import { UserOutlined, EditOutlined, UploadOutlined } from '@ant-design/icons'
import { authAPI, uploadAPI } from '@api/services'
import type { User } from '../../types/api'
import styles from './index.module.scss'
import { RcFile } from 'antd/lib/upload'

const ProfilePage: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [userInfo, setUserInfo] = useState<User | null>(null)
  const [editing, setEditing] = useState(false)

  // 获取用户信息
  const fetchUserInfo = async () => {
    try {
      const response = await authAPI.getProfile()
      setUserInfo(response.data as any)
      form.setFieldsValue({
        nickname: response.data.nickname,
        bio: response.data.bio
      })
      setLoading(false)
    } catch (error) {
      console.error('获取用户信息失败:', error)
      message.error('获取用户信息失败')
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserInfo()
  }, [])

  // 处理头像上传
  const handleAvatarUpload = async (file: RcFile) => {
    try {
      const response = await uploadAPI.uploadFile(file, '/upload/avatar')
      await authAPI.updateProfile({ avatar: response.data.url })
      setUserInfo((prev: User | null) => (prev ? { ...prev, avatar: response.data.url } : null))
      message.success('头像更新成功')
      return false // 阻止自动上传
    } catch (error) {
      console.error('上传头像失败:', error)
      message.error('上传头像失败')
      return false
    }
  }

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      const response = await authAPI.updateProfile(values)
      setUserInfo(response.data as any)
      setEditing(false)
      message.success('个人资料更新成功')
    } catch (error) {
      console.error('更新个人资料失败:', error)
      message.error('更新个人资料失败')
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
