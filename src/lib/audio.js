let audioCtx = null

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  return audioCtx
}

export function playSound(type) {
  try {
    const ctx = getCtx()
    if (type === 'correct') {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.frequency.setValueAtTime(523, ctx.currentTime)
      o.frequency.setValueAtTime(659, ctx.currentTime + 0.1)
      g.gain.setValueAtTime(0.2, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
      o.start(); o.stop(ctx.currentTime + 0.3)
    } else if (type === 'wrong') {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.frequency.setValueAtTime(200, ctx.currentTime)
      o.frequency.setValueAtTime(130, ctx.currentTime + 0.2)
      g.gain.setValueAtTime(0.3, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      o.start(); o.stop(ctx.currentTime + 0.4)
    } else if (type === 'linestop') {
      for (let i = 0; i < 3; i++) {
        const o = ctx.createOscillator(), g = ctx.createGain()
        o.connect(g); g.connect(ctx.destination)
        o.frequency.setValueAtTime(400, ctx.currentTime + i * 0.3)
        o.frequency.linearRampToValueAtTime(800, ctx.currentTime + i * 0.3 + 0.15)
        o.frequency.linearRampToValueAtTime(400, ctx.currentTime + i * 0.3 + 0.3)
        g.gain.setValueAtTime(0.5, ctx.currentTime + i * 0.3)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.3 + 0.3)
        o.start(ctx.currentTime + i * 0.3)
        o.stop(ctx.currentTime + i * 0.3 + 0.3)
      }
    }
  } catch (e) {}
}
