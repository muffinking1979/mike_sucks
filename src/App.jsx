import './App.css'

function Word({ text }) {
  return (
    <p>
      {text.split('').map((ch, i) => <span key={i}>{ch}</span>)}
    </p>
  )
}

export default function App() {
  return (
    <div id="container">
      <Word text="Mike" />
      <Word text="Stamm" />
      <Word text="Sucks" />
      <Word text=".com" />
      <img src="/MSS.jpeg" alt="Mike Stamm" id="mike-img" />
    </div>
  )
}
