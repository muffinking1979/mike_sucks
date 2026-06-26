import { useRef, useEffect, useState, useCallback } from 'react'
import './App.css'
import mikeImg from './assets/MSS.jpeg'

function Word({ text }) {
  const ref = useRef()
  useEffect(() => {
    const el = ref.current
    const scale = el.parentElement.clientWidth / el.scrollWidth
    el.style.transform = `scaleX(${scale})`
  }, [])
  return <p ref={ref}>{text}</p>
}

const COLORS = [
  { label: 'Red',    value: '#ee1111' },
  { label: 'Blue',   value: '#1133ee' },
  { label: 'Yellow', value: '#ffdd00' },
]

function DrawingModal({ onClose }) {
  const canvasRef = useRef()
  const imgRef = useRef()
  const [color, setColor] = useState(COLORS[0].value)
  const [ready, setReady] = useState(false)
  const drawing = useRef(false)
  const last = useRef(null)

  useEffect(() => {
    const img = imgRef.current
    if (img.complete) { setReady(true) }
    else { img.onload = () => setReady(true) }
  }, [])

  useEffect(() => {
    if (!ready) return
    const canvas = canvasRef.current
    const img = imgRef.current
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
  }, [ready])

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const src = e.touches ? e.touches[0] : e
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top) * scaleY,
    }
  }

  const startDraw = useCallback((e) => {
    e.preventDefault()
    drawing.current = true
    last.current = getPos(e, canvasRef.current)
  }, [])

  const draw = useCallback((e) => {
    e.preventDefault()
    if (!drawing.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(last.current.x, last.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = color
    ctx.lineWidth = 12
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    last.current = pos
  }, [color])

  const stopDraw = useCallback(() => {
    drawing.current = false
    last.current = null
  }, [])

  const download = () => {
    const img = imgRef.current
    const canvas = canvasRef.current
    const out = document.createElement('canvas')
    out.width = img.naturalWidth
    out.height = img.naturalHeight
    const ctx = out.getContext('2d')
    ctx.drawImage(img, 0, 0)
    ctx.drawImage(canvas, 0, 0)
    const link = document.createElement('a')
    link.download = 'mike-stamm-sucks.png'
    link.href = out.toDataURL('image/png')
    link.click()
  }

  return (
    <div id="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div id="modal">
        <div id="drawing-area">
          <img ref={imgRef} src={mikeImg} alt="Mike Stamm" id="modal-img" crossOrigin="anonymous" />
          <canvas
            ref={canvasRef}
            id="draw-canvas"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />
        </div>
        <div id="toolbar">
          <div id="colors">
            {COLORS.map(c => (
              <button
                key={c.value}
                className={'swatch' + (color === c.value ? ' active' : '')}
                style={{ background: c.value }}
                onClick={() => setColor(c.value)}
                aria-label={c.label}
              />
            ))}
          </div>
          <button id="download-btn" onClick={download}>Download</button>
          <button id="close-btn" onClick={onClose}>✕</button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [modalOpen, setModalOpen] = useState(false)
  return (
    <div id="container">
      <div id="words">
        <Word text="Mike" />
        <Word text="Stamm" />
        <Word text="Sucks" />
        <Word text=".com" />
      </div>
      <img
        src={mikeImg}
        alt="Mike Stamm"
        id="mike-img"
        onClick={() => setModalOpen(true)}
      />
      {modalOpen && <DrawingModal onClose={() => setModalOpen(false)} />}
    </div>
  )
}
