import { request } from '../axios'

// 文件上传API
export const uploadFile = (file: File, uploadUrl: string) => {
  const formData = new FormData()
  formData.append('file', file)
  
  return request<{ url: string }>({
    url: uploadUrl,
    method: 'POST',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
} 