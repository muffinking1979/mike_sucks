import { useRef, useEffect } from 'react'
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

export default function App() {
  return (
    <div id="container">
      <div id="words">
        <Word text="Mike" />
        <Word text="Stamm" />
        <Word text="Sucks" />
      </div>
      <p id="dotcom">.com</p>
      <img src={mikeImg} alt="Mike Stamm" id="mike-img" />
    </div>
  )
}
