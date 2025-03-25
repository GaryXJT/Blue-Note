import React, { useState, useEffect } from 'react'
import { Card, Avatar, Form, Input, Button, Upload, message, Spin } from 'antd'
import { UserOutlined, EditOutlined, UploadOutlined } from '@ant-design/icons'
import { userAPI, uploadAPI } from '@/api/services'
import styles from './index.module.scss'
import { RcFile } from 'antd/lib/upload'
import PrivateRoute from '@/components/auth/PrivateRoute'
import useAuthStore from '@/store/useAuthStore'

const ProfilePage: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  
  // 使用Zustand获取用户信息
  const { currentUser, updateUser } = useAuthStore()

  // 初始化表单
  useEffect(() => {
    if (currentUser) {
      form.setFieldsValue({
        nickname: currentUser.nickname,
        bio: currentUser.bio
      })
    }
  }, [currentUser, form])

  // 处理头像上传
  const handleAvatarUpload = async (file: RcFile) => {
    try {
      setLoading(true)
      const response = await uploadAPI.uploadFile(file, 'avatar')
      
      if (response.code === 0 && response.data) {
        // 更新用户头像
        const updateResponse = await userAPI.updateProfile({ 
          avatar: response.data.url 
        })
        
        if (updateResponse.code === 0) {
          // 更新Zustand状态
          updateUser({ avatar: response.data.url })
          message.success('头像更新成功')
        }
      }
      return false // 阻止自动上传
    } catch (error) {
      console.error('上传头像失败:', error)
      message.error('上传头像失败')
      return false
    } finally {
      setLoading(false)
    }
  }

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      const response = await userAPI.updateProfile(values)
      
      if (response.code === 0) {
        // 更新Zustand状态
        updateUser(values)
        setEditing(false)
        message.success('个人资料更新成功')
      } else {
        message.error(response.message || '更新个人资料失败')
      }
    } catch (error) {
      console.error('更新个人资料失败:', error)
      message.error('更新个人资料失败')
    } finally {
      setLoading(false)
    }
  }

  if (!currentUser) {
    return (
      <div className={styles.loading}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <PrivateRoute>
      <div className={styles.container}>
        <Card className={styles.profileCard}>
          <div className={styles.header}>
            <div className={styles.avatarSection}>
              <Avatar size={120} src={currentUser.avatar} icon={!currentUser.avatar ? <UserOutlined /> : null} />
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
              <h2>{currentUser.nickname || currentUser.username}</h2>
              <p>注册时间：{new Date(currentUser.createdAt).toLocaleDateString()}</p>
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
    </PrivateRoute>
  )
}

export default ProfilePage
