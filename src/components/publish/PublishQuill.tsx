import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
} from 'react'
import dynamic from 'next/dynamic'
import 'react-quill/dist/quill.snow.css'
import styles from './PublishQuill.module.scss'

// 动态导入 React Quill 避免服务端渲染问题
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

// 编辑器工具栏配置
const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
}

// 正则表达式用于计算纯文本字数
const getTextLength = (html: string): number => {
  if (!html) return 0

  // 移除HTML标签，保留文本内容
  const text = html.replace(/<[^>]*>/g, '')

  // 解码HTML实体
  const decoded = text.replace(/&[a-zA-Z]+;/g, ' ')

  // 处理表情符号，每个表情符号应该算作一个字符
  // Unicode 表情符号通常由多个编码点组成，但应该算作一个字符
  const normalizedText = Array.from(decoded.trim()).length

  return normalizedText
}

export interface PublishQuillProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onEditorReady?: (editor: any) => void
  maxLength?: number
  onTextLengthChange?: (length: number) => void
}

export interface PublishQuillRef {
  insertEmoji: (emoji: string) => boolean
  focus: () => void
  getEditor: () => any
  getTextLength: () => number
}

const PublishQuill = forwardRef<PublishQuillRef, PublishQuillProps>(
  (props, ref) => {
    const {
      value,
      onChange,
      placeholder,
      onEditorReady,
      maxLength = 1000,
      onTextLengthChange,
    } = props
    const [editor, setEditor] = useState<any>(null)
    const [textLength, setTextLength] = useState(0)

    // 计算文本长度
    useEffect(() => {
      const length = getTextLength(value)
      setTextLength(length)
      if (onTextLengthChange) {
        onTextLengthChange(length)
      }
    }, [value, onTextLengthChange])

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      insertEmoji: (emoji: string): boolean => {
        if (editor) {
          try {
            // 确保编辑器获得焦点
            editor.focus()

            // 获取光标位置
            const range = editor.getSelection() || { index: 0, length: 0 }

            // 使用Quill的基本API直接在光标位置插入文本
            // retain(index)表示保留index个字符，然后在position位置插入表情
            editor.updateContents([{ retain: range.index }, { insert: emoji }])

            // 将光标移到插入后的位置
            editor.setSelection(range.index + 1, 0)

            return true
          } catch (error) {
            console.error('插入表情失败:', error)
          }
        }
        return false
      },
      focus: () => {
        if (editor) {
          editor.focus()
        }
      },
      getEditor: () => editor,
      getTextLength: () => textLength,
    }))

    // 当编辑器挂载完成时
    const handleEditorCreated = (quill: any) => {
      setEditor(quill)
      if (onEditorReady) {
        onEditorReady(quill)
      }
    }

    // 判断是否超出字符限制
    const isOverLimit = textLength > maxLength

    // 由于是动态导入，需要确保在客户端渲染
    if (typeof window === 'undefined') {
      return null
    }

    return (
      <div className={styles.quillWrapper}>
        <ReactQuill
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          placeholder={placeholder || '请输入正文内容...'}
          onReady={handleEditorCreated}
        />
        <div
          className={`${styles.quillCounter} ${
            isOverLimit ? styles.error : ''
          }`}>
          {textLength}/{maxLength}
        </div>
      </div>
    )
  }
)

PublishQuill.displayName = 'PublishQuill'

export default PublishQuill
