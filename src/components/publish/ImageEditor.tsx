import React from 'react'
import { CloseOutlined, PlusOutlined } from '@ant-design/icons'
import styles from './ImageEditor.module.scss'

interface ImageEditorProps {
  images: File[]
  onAddImage: () => void
  onRemoveImage: (index: number) => void
  onReorder?: (fromIndex: number, toIndex: number) => void
}

const ImageEditor: React.FC<ImageEditorProps> = ({
  images,
  onAddImage,
  onRemoveImage,
}) => {
  return (
    <div className={styles.imageEditor}>
      <div className={styles.imageGrid}>
        {images.map((file, index) => (
          <div key={index} className={styles.imageItem}>
            <div className={styles.imageWrapper}>
              <img src={URL.createObjectURL(file)} alt={`图片 ${index + 1}`} />
              <div className={styles.imageOverlay}>
                <button
                  className={styles.removeButton}
                  onClick={() => onRemoveImage(index)}>
                  <CloseOutlined />
                </button>
              </div>
            </div>
            {index === 0 && <div className={styles.coverTag}>封面</div>}
          </div>
        ))}
        {images.length < 18 && (
          <button className={styles.addButton} onClick={onAddImage}>
            <PlusOutlined />
            <span>添加图片</span>
          </button>
        )}
      </div>
      <div className={styles.imageInfo}>
        <span className={styles.imageCount}>{images.length}/18</span>
        <span className={styles.imageTip}>请选择重要的图片放在前面</span>
      </div>
    </div>
  )
}

export default ImageEditor
