import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { SmileOutlined } from '@ant-design/icons'
import styles from './RichTextEditor.module.scss'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

// 动态导入编辑器组件，禁用SSR
const Editor = dynamic(
  () => import('@wangeditor/editor-for-react').then((mod) => mod.Editor),
  { ssr: false }
)

const Toolbar = dynamic(
  () => import('@wangeditor/editor-for-react').then((mod) => mod.Toolbar),
  { ssr: false }
)

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = '输入正文内容...',
}) => {
  const [editor, setEditor] = useState<any>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  // 组件销毁时销毁编辑器实例
  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy()
      }
    }
  }, [editor])

  const handleEmojiSelect = (emoji: any) => {
    if (editor) {
      editor.insertText(emoji.native)
    }
    setShowEmojiPicker(false)
  }

  return (
    <div className={styles.editor}>
      <Toolbar
        editor={editor}
        mode="default"
        style={{ borderBottom: '1px solid #e8e8e8' }}
      />
      <Editor
        value={value}
        onCreated={setEditor}
        onChange={onChange}
        mode="default"
        style={{ height: '300px', overflowY: 'hidden' }}
        placeholder={placeholder}
      />
      <div className={styles.emojiButton}>
        <button onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
          <SmileOutlined />
        </button>
        {showEmojiPicker && (
          <div className={styles.emojiPicker}>
            <Picker
              data={data}
              onEmojiSelect={handleEmojiSelect}
              theme="light"
              locale="zh"
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default RichTextEditor
