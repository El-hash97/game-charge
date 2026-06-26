import { useEffect, useRef } from 'react'

const COLORS = ['#e02020','#22c55e','#3b82f6','#f0b429','#ff4444']

export default function Confetti() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight

    const ptcls = Array.from({ length: 80 }, () => ({
      x:   Math.random() * canvas.width,
      y:   -10,
      w:   Math.random() * 7 + 4,
      h:   Math.random() * 12 + 5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      vx:  (Math.random() - 0.5) * 4,
      vy:  Math.random() * 4 + 2,
      rot: Math.random() * 360,
      vr:  (Math.random() - 0.5) * 8,
    }))

    let f = 0, raf
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ptcls.forEach(p => {
        ctx.save()
        ctx.translate(p.x + p.w / 2, p.y + p.h / 2)
        ctx.rotate(p.rot * Math.PI / 180)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()
        p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.vy += 0.1
      })
      if (++f < 120) raf = requestAnimationFrame(draw)
      else ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" />
}
