import React, { useEffect } from 'react'
import { useRouter } from 'next/router'
import useAuthStore from '@/store/useAuthStore'
import { message } from 'antd'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string // 可选，特定角色要求（如admin）
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole
}) => {
  const router = useRouter()
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn)
  const user = useAuthStore((state) => state.user)
  
  useEffect(() => {
    // 检查是否登录
    if (!isLoggedIn) {
      message.error('请先登录')
      // 如果当前不在登录页面，才重定向
      if (router.pathname !== '/') {
        router.push('/')
      }
      return
    }
    
    // 如果需要特定角色，检查用户角色
    if (requiredRole && user?.role !== requiredRole) {
      message.error('您没有权限访问此页面')
      // 如果当前不在首页，才重定向
      if (router.pathname !== '/') {
        router.push('/')
      }
      return
    }
  }, [isLoggedIn, user, requiredRole, router])
  
  // 如果未登录或没有所需权限，不渲染子组件
  if (!isLoggedIn || (requiredRole && user?.role !== requiredRole)) {
    return null
  }
  
  // 否则渲染子组件
  return <>{children}</>
}

export default ProtectedRoute