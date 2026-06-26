import { useRef, useEffect, useState } from 'react'
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
  const canvasRef   = useRef()
  const imgRef      = useRef()
  const containerRef = useRef()
  const innerRef    = useRef()

  const [color, setColor] = useState(COLORS[0].value)
  const [mode, setMode]   = useState('draw') // 'draw' | 'move'
  const [ready, setReady] = useState(false)

  // transform state stored in refs so event handlers don't go stale
  const t = useRef({ panX: 0, panY: 0, zoom: 1 })
  const drawingRef   = useRef(false)
  const lastPos      = useRef(null)
  const lastTouches  = useRef([])
  const colorRef     = useRef(color)
  const modeRef      = useRef(mode)

  useEffect(() => { colorRef.current = color }, [color])
  useEffect(() => { modeRef.current  = mode  }, [mode])

  // ── setup ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const img = imgRef.current
    const init = () => {
      canvasRef.current.width  = img.naturalWidth
      canvasRef.current.height = img.naturalHeight
      setReady(true)
    }
    if (img.complete) init(); else img.onload = init
  }, [])

  // ── helpers ────────────────────────────────────────────────────────────
  const applyTransform = () => {
    const { panX, panY, zoom } = t.current
    innerRef.current.style.transform = `translate(${panX}px,${panY}px) scale(${zoom})`
  }

  const clampPan = () => {
    const { zoom } = t.current
    const cRect   = containerRef.current.getBoundingClientRect()
    const img     = imgRef.current
    const innerH  = cRect.width * img.naturalHeight / img.naturalWidth
    t.current.panX = Math.min(0, Math.max(cRect.width  - cRect.width  * zoom, t.current.panX))
    t.current.panY = Math.min(0, Math.max(cRect.height - innerH       * zoom, t.current.panY))
  }

  const screenToCanvas = (sx, sy) => {
    const cRect  = containerRef.current.getBoundingClientRect()
    const canvas = canvasRef.current
    const img    = imgRef.current
    const { panX, panY, zoom } = t.current
    const innerW = cRect.width
    const innerH = cRect.width * img.naturalHeight / img.naturalWidth
    const cssX   = (sx - cRect.left - panX) / zoom
    const cssY   = (sy - cRect.top  - panY) / zoom
    return { x: cssX * canvas.width / innerW, y: cssY * canvas.height / innerH }
  }

  const strokeTo = (pos) => {
    if (!lastPos.current) return
    const ctx = canvasRef.current.getContext('2d')
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = colorRef.current
    ctx.lineWidth   = 14
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    ctx.stroke()
    lastPos.current = pos
  }

  const zoomAround = (sx, sy, scaleFactor) => {
    const cRect = containerRef.current.getBoundingClientRect()
    const { panX, panY, zoom } = t.current
    const cssX   = (sx - cRect.left - panX) / zoom
    const cssY   = (sy - cRect.top  - panY) / zoom
    const newZoom = Math.max(1, Math.min(10, zoom * scaleFactor))
    t.current.panX = sx - cRect.left - cssX * newZoom
    t.current.panY = sy - cRect.top  - cssY * newZoom
    t.current.zoom = newZoom
  }

  // ── touch ──────────────────────────────────────────────────────────────
  const onTouchStart = (e) => {
    e.preventDefault()
    lastTouches.current = Array.from(e.touches)
    if (e.touches.length === 1 && modeRef.current === 'draw') {
      drawingRef.current = true
      lastPos.current = screenToCanvas(e.touches[0].clientX, e.touches[0].clientY)
    } else {
      drawingRef.current = false
      lastPos.current = null
    }
  }

  const onTouchMove = (e) => {
    e.preventDefault()
    const touches = Array.from(e.touches)
    const prev    = lastTouches.current

    if (touches.length === 2 && prev.length >= 1) {
      // pinch-zoom + pan
      drawingRef.current = false
      lastPos.current    = null

      const prevMid = prev.length === 2
        ? { x: (prev[0].clientX + prev[1].clientX) / 2, y: (prev[0].clientY + prev[1].clientY) / 2 }
        : { x: prev[0].clientX, y: prev[0].clientY }
      const currMid = { x: (touches[0].clientX + touches[1].clientX) / 2, y: (touches[0].clientY + touches[1].clientY) / 2 }

      // pan from midpoint drift first
      t.current.panX += currMid.x - prevMid.x
      t.current.panY += currMid.y - prevMid.y

      // then zoom around new midpoint
      if (prev.length === 2) {
        const prevDist = Math.hypot(prev[0].clientX - prev[1].clientX, prev[0].clientY - prev[1].clientY)
        const currDist = Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY)
        if (prevDist > 0) zoomAround(currMid.x, currMid.y, currDist / prevDist)
      }

      clampPan()
      applyTransform()

    } else if (touches.length === 1 && prev.length === 1) {
      if (modeRef.current === 'move') {
        t.current.panX += touches[0].clientX - prev[0].clientX
        t.current.panY += touches[0].clientY - prev[0].clientY
        clampPan()
        applyTransform()
      } else if (drawingRef.current) {
        strokeTo(screenToCanvas(touches[0].clientX, touches[0].clientY))
      }
    }

    lastTouches.current = touches
  }

  const onTouchEnd = (e) => {
    e.preventDefault()
    lastTouches.current = Array.from(e.touches)
    if (e.touches.length === 0) { drawingRef.current = false; lastPos.current = null }
  }

  // ── mouse (desktop) ────────────────────────────────────────────────────
  const onMouseDown = (e) => {
    if (modeRef.current !== 'draw') return
    drawingRef.current = true
    lastPos.current = screenToCanvas(e.clientX, e.clientY)
  }
  const onMouseMove = (e) => {
    if (!drawingRef.current) return
    strokeTo(screenToCanvas(e.clientX, e.clientY))
  }
  const onMouseUp = () => { drawingRef.current = false; lastPos.current = null }

  // ── wheel zoom (desktop) ───────────────────────────────────────────────
  const onWheel = (e) => {
    e.preventDefault()
    zoomAround(e.clientX, e.clientY, e.deltaY < 0 ? 1.1 : 0.9)
    clampPan()
    applyTransform()
  }
  useEffect(() => {
    const el = containerRef.current
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // ── download ───────────────────────────────────────────────────────────
  const download = () => {
    const img  = imgRef.current
    const out  = document.createElement('canvas')
    out.width  = img.naturalWidth
    out.height = img.naturalHeight
    const ctx  = out.getContext('2d')
    ctx.drawImage(img, 0, 0)
    ctx.drawImage(canvasRef.current, 0, 0)
    const link = document.createElement('a')
    link.download = 'mike-stamm-sucks.png'
    link.href = out.toDataURL('image/png')
    link.click()
  }

  return (
    <div id="modal-backdrop">
      <div id="modal">
        <div id="drawing-container" ref={containerRef}>
          <div
            ref={innerRef}
            id="drawing-inner"
            style={{ cursor: mode === 'draw' ? 'crosshair' : 'grab' }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <img ref={imgRef} src={mikeImg} alt="Mike Stamm" id="modal-img" crossOrigin="anonymous" />
            {ready && <canvas ref={canvasRef} id="draw-canvas" />}
          </div>
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
          <button
            id="mode-btn"
            className={mode === 'move' ? 'active' : ''}
            onClick={() => setMode(m => m === 'draw' ? 'move' : 'draw')}
            title={mode === 'draw' ? 'Switch to pan/zoom' : 'Switch to draw'}
          >{mode === 'draw' ? '✋' : '✏️'}</button>
          <button id="download-btn" onClick={download}>Save</button>
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
      <img src={mikeImg} alt="Mike Stamm" id="mike-img" onClick={() => setModalOpen(true)} />
      {modalOpen && <DrawingModal onClose={() => setModalOpen(false)} />}
    </div>
  )
}
