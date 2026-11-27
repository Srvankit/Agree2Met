import { useState, useRef } from 'react';
import { UploadCloud, File, X, AlertCircle } from 'lucide-react';
import styles from './FileDropzone.module.css';

export function FileDropzone({
  onFilesSelected,
  accept = '.pdf,.doc,.docx,.png,.jpg,.jpeg',
  maxSizeMB = 10,
  multiple = false,
  label = 'Drag and drop files here, or click to browse',
  hint = 'Supports PDF, Word, and images up to 10MB',
  className = '',
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleFiles = (files) => {
    setError(null);
    const validList = [];
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    for (const file of Array.from(files)) {
      if (file.size > maxSizeBytes) {
        setError(`File "${file.name}" exceeds the ${maxSizeMB}MB limit.`);
        return;
      }
      validList.push(file);
    }

    if (!multiple && validList.length > 1) {
      validList.splice(1);
    }

    setSelectedFiles((prev) => (multiple ? [...prev, ...validList] : validList));
    if (onFilesSelected) {
      onFilesSelected(multiple ? [...selectedFiles, ...validList] : validList);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemove = (index) => {
    const updated = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updated);
    if (onFilesSelected) onFilesSelected(updated);
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <div
        className={`${styles.dropArea} ${isDragging ? styles.dragging : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className={styles.hiddenInput}
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
          }}
        />
        <UploadCloud className={styles.icon} size={32} />
        <p className={styles.mainText}>{label}</p>
        <p className={styles.hintText}>{hint}</p>
      </div>

      {error && (
        <div className={styles.errorAlert} role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className={styles.fileList}>
          {selectedFiles.map((file, idx) => (
            <div key={`${file.name}-${idx}`} className={styles.fileItem}>
              <File size={16} className={styles.fileIcon} />
              <div className={styles.fileInfo}>
                <span className={styles.fileName}>{file.name}</span>
                <span className={styles.fileSize}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
              <button
                type="button"
                className={styles.removeBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(idx);
                }}
                aria-label={`Remove ${file.name}`}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
