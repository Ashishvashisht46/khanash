import React, { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  File,
  FileText,
  Image,
  Film,
  Music,
  Archive,
  X,
  AlertCircle,
} from 'lucide-react';

function getFileIcon(type) {
  if (type.startsWith('image/')) return Image;
  if (type.startsWith('video/')) return Film;
  if (type.startsWith('audio/')) return Music;
  if (type === 'application/pdf') return FileText;
  if (type.includes('zip') || type.includes('archive') || type.includes('compressed'))
    return Archive;
  return File;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function Dropzone({
  onFiles,
  accept,
  maxSizeMB = 10,
  multiple = true,
}) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState([]);

  const validateAndAdd = useCallback(
    (incoming) => {
      const maxBytes = maxSizeMB * 1024 * 1024;
      const newErrors = [];
      const valid = [];

      Array.from(incoming).forEach((f) => {
        if (f.size > maxBytes) {
          newErrors.push(`"${f.name}" exceeds ${maxSizeMB} MB limit.`);
        } else {
          valid.push(f);
        }
      });

      const merged = multiple ? [...files, ...valid] : valid.slice(0, 1);
      setFiles(merged);
      setErrors(newErrors);
      onFiles?.(merged);
    },
    [files, maxSizeMB, multiple, onFiles]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      validateAndAdd(e.dataTransfer.files);
    },
    [validateAndAdd]
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleChange = (e) => {
    if (e.target.files?.length) {
      validateAndAdd(e.target.files);
    }
    e.target.value = '';
  };

  const removeFile = (index) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onFiles?.(updated);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Drop zone */}
      <motion.div
        animate={
          isDragging
            ? { borderColor: 'rgba(201,168,76,0.8)', boxShadow: '0 0 24px rgba(201,168,76,0.2)' }
            : { borderColor: 'rgba(201,168,76,0.25)', boxShadow: '0 0 0px rgba(201,168,76,0)' }
        }
        transition={{ duration: 0.2 }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={[
          'relative flex flex-col items-center justify-center gap-3',
          'rounded-xl border-2 border-dashed cursor-pointer',
          'px-6 py-10 transition-colors duration-200',
          isDragging ? 'bg-gold/5' : 'bg-white/[0.02] hover:bg-white/[0.04]',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
        />
        <motion.div
          animate={{ scale: isDragging ? 1.1 : 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="p-3 rounded-full bg-gold/10 text-gold"
        >
          <UploadCloud className="w-6 h-6" />
        </motion.div>
        <div className="text-center">
          <p className="text-sm text-text-primary font-medium">
            <span className="text-gold">Click to upload</span> or drag &amp; drop
          </p>
          <p className="text-xs text-text-muted mt-1">
            {accept ? `Accepted: ${accept}` : 'Any file type'}
            {' · '}
            Max {maxSizeMB} MB
          </p>
        </div>
      </motion.div>

      {/* Errors */}
      <AnimatePresence>
        {errors.map((err, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center gap-1.5 text-xs text-red-400"
          >
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {err}
          </motion.p>
        ))}
      </AnimatePresence>

      {/* File list */}
      <AnimatePresence initial={false}>
        {files.map((file, index) => {
          const Icon = getFileIcon(file.type);
          return (
            <motion.div
              key={`${file.name}-${index}`}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-3 rounded-lg bg-white/[0.04] border border-gold/10 px-3 py-2.5"
            >
              <span className="text-gold/70 flex-shrink-0">
                <Icon className="w-4 h-4" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary truncate">{file.name}</p>
                <p className="text-[10px] text-text-muted">{formatBytes(file.size)}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="p-1 rounded text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
