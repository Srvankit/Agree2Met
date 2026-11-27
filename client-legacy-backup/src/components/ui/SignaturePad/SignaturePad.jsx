import { useState, useRef, useEffect, useCallback } from 'react';
import { PenTool, Type, Upload, RotateCcw, Trash2 } from 'lucide-react';
import styles from './SignaturePad.module.css';

export function SignaturePad({
  value,
  onChange,
  onClear,
  width = 500,
  height = 200,
  signerName = '',
  className = '',
}) {
  const [mode, setMode] = useState('draw'); // 'draw' | 'type' | 'upload'
  const [typedName, setTypedName] = useState(signerName || '');
  const [selectedFont, setSelectedFont] = useState('cursive');
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const historyRef = useRef([]);

  const getCanvasContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d');
  }, []);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    historyRef.current.push(canvas.toDataURL());
    if (historyRef.current.length > 20) historyRef.current.shift();
    if (onChange) onChange(canvas.toDataURL());
  }, [onChange]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getCanvasContext();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    historyRef.current = [];
    if (onClear) onClear();
    if (onChange) onChange(null);
  }, [getCanvasContext, onClear, onChange]);

  const handleUndo = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getCanvasContext();
    if (!canvas || !ctx || historyRef.current.length === 0) return;

    historyRef.current.pop(); // Remove current state
    if (historyRef.current.length > 0) {
      const prevData = historyRef.current[historyRef.current.length - 1];
      const img = new Image();
      img.src = prevData;
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        if (onChange) onChange(prevData);
      };
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (onChange) onChange(null);
    }
  }, [getCanvasContext, onChange]);

  // Initial canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e1b4b'; // Dark ink color

    if (value && historyRef.current.length === 0) {
      const img = new Image();
      img.src = value;
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        historyRef.current.push(value);
      };
    }
  }, [value]);

  // Drawing event handlers
  const startDrawing = (e) => {
    if (mode !== 'draw') return;
    isDrawing.current = true;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = getCanvasContext();
    if (!ctx) return;

    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing.current || mode !== 'draw') return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = getCanvasContext();
    if (!ctx) return;

    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing.current || mode !== 'draw') return;
    isDrawing.current = false;
    saveToHistory();
  };

  // Typed signature generation
  const renderTypedSignature = useCallback((text, font) => {
    const canvas = canvasRef.current;
    const ctx = getCanvasContext();
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!text) {
      if (onChange) onChange(null);
      return;
    }

    ctx.font = `italic 42px ${font === 'cursive' ? 'Brush Script MT, cursive' : 'Zapfino, Segoe Script, cursive'}`;
    ctx.fillStyle = '#1e1b4b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    saveToHistory();
  }, [getCanvasContext, onChange, saveToHistory]);

  const handleTypeChange = (e) => {
    const val = e.target.value;
    setTypedName(val);
    renderTypedSignature(val, selectedFont);
  };

  const handleFontSelect = (font) => {
    setSelectedFont(font);
    renderTypedSignature(typedName, font);
  };

  // Image Upload handler
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = getCanvasContext();
        if (!canvas || !ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Scale to fit canvas while preserving aspect ratio
        const scale = Math.min(
          (canvas.width * 0.8) / img.width,
          (canvas.height * 0.8) / img.height
        );
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (canvas.width - w) / 2;
        const y = (canvas.height - h) / 2;

        ctx.drawImage(img, x, y, w, h);
        saveToHistory();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={`${styles.signaturePad} ${className}`}>
      <div className={styles.modeTabs}>
        <button
          type="button"
          className={`${styles.tab} ${mode === 'draw' ? styles.activeTab : ''}`}
          onClick={() => {
            setMode('draw');
            clearCanvas();
          }}
        >
          <PenTool size={16} />
          <span>Draw</span>
        </button>
        <button
          type="button"
          className={`${styles.tab} ${mode === 'type' ? styles.activeTab : ''}`}
          onClick={() => {
            setMode('type');
            if (typedName) renderTypedSignature(typedName, selectedFont);
          }}
        >
          <Type size={16} />
          <span>Type</span>
        </button>
        <button
          type="button"
          className={`${styles.tab} ${mode === 'upload' ? styles.activeTab : ''}`}
          onClick={() => {
            setMode('upload');
            clearCanvas();
          }}
        >
          <Upload size={16} />
          <span>Upload</span>
        </button>
      </div>

      <div className={styles.canvasWrapper}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className={styles.canvas}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        <div className={styles.baseline} aria-hidden="true" />
        <span className={styles.signHereHint}>Sign above this line</span>
      </div>

      {mode === 'type' && (
        <div className={styles.typeControls}>
          <input
            type="text"
            className={styles.textInput}
            value={typedName}
            onChange={handleTypeChange}
            placeholder="Type your full legal name..."
          />
          <div className={styles.fontSelect}>
            <button
              type="button"
              className={`${styles.fontBtn} ${selectedFont === 'cursive' ? styles.activeFont : ''}`}
              style={{ fontFamily: 'Brush Script MT, cursive' }}
              onClick={() => handleFontSelect('cursive')}
            >
              Classic Script
            </button>
            <button
              type="button"
              className={`${styles.fontBtn} ${selectedFont === 'segoe' ? styles.activeFont : ''}`}
              style={{ fontFamily: 'Segoe Script, cursive' }}
              onClick={() => handleFontSelect('segoe')}
            >
              Modern Flow
            </button>
          </div>
        </div>
      )}

      {mode === 'upload' && (
        <div className={styles.uploadControls}>
          <label className={styles.uploadBtn}>
            <Upload size={16} />
            <span>Select PNG or JPG image</span>
            <input
              type="file"
              accept="image/png, image/jpeg"
              onChange={handleImageUpload}
              className={styles.hiddenFile}
            />
          </label>
        </div>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.actionBtn}
          onClick={handleUndo}
          title="Undo last stroke"
        >
          <RotateCcw size={14} />
          <span>Undo</span>
        </button>
        <button
          type="button"
          className={styles.actionBtn}
          onClick={clearCanvas}
          title="Clear signature"
        >
          <Trash2 size={14} />
          <span>Clear</span>
        </button>
      </div>
    </div>
  );
}
