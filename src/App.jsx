import { useState, useEffect, useCallback } from 'react'
import { getUsers, saveUsers, getLogs, saveLogs } from './lib/storage.js'
import LoginScreen from './screens/LoginScreen.jsx'
import DashboardScreen from './screens/DashboardScreen.jsx'
import GameScreen from './screens/GameScreen.jsx'
import ResultScreen from './screens/ResultScreen.jsx'
import LeaderboardScreen from './screens/LeaderboardScreen.jsx'
import TargetModal from './components/TargetModal.jsx'
import Toast from './components/Toast.jsx'

export default function App() {
  const [screen, setScreen]           = useState('login')
  const [currentUser, setCurrentUser] = useState(null)
  const [currentMode, setCurrentMode] = useState(null)
  const [pendingMode, setPendingMode] = useState(null)
  const [showModal, setShowModal]     = useState(false)
  const [gameConfig, setGameConfig]   = useState(null)
  const [gameResult, setGameResult]   = useState(null)
  const [toast, setToast]             = useState(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('fcs_me')
      if (saved) {
        const user = JSON.parse(saved)
        if (getUsers()[user.noreg]) {
          setCurrentUser(user)
          setScreen('dashboard')
          return
        }
      }
    } catch (e) {}
    setScreen('login')
  }, [])

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }, [])

  function doLogin(name, noreg) {
    if (!name || !noreg) { showToast('Nama dan Noreg wajib diisi!'); return }
    const users = getUsers()
    users[noreg] = { name, noreg, joinedAt: users[noreg]?.joinedAt || Date.now() }
    saveUsers(users)
    const user = { name, noreg }
    setCurrentUser(user)
    localStorage.setItem('fcs_me', JSON.stringify(user))
    setScreen('dashboard')
  }

  function doLogout() {
    if (!confirm('Keluar dari sesi ini?')) return
    setCurrentUser(null)
    localStorage.removeItem('fcs_me')
    setScreen('login')
  }

  function openTargetModal(mode) {
    setPendingMode(mode)
    setShowModal(true)
  }

  function confirmTarget(target) {
    setShowModal(false)
    setCurrentMode(pendingMode)
    setGameConfig({ mode: pendingMode, target })
    setScreen('game')
  }

  function handleGameEnd(result) {
    saveLogs([...getLogs(), {
      noreg:        currentUser?.noreg || 'guest',
      name:         currentUser?.name  || 'Operator',
      mode:         result.mode,
      score:        result.score,
      maxStreak:    result.maxStreak,
      totalAnswers: result.totalAnswers,
      wrongAnswers: result.wrongAnswers,
      lineStop:     result.lineStop,
      target:       result.target,
      duration:     result.duration,
      ts:           Date.now()
    }])
    setGameResult(result)
    setScreen('result')
  }

  function playAgain() {
    openTargetModal(currentMode)
  }

  function goToDashboard() {
    setScreen('dashboard')
  }

  return (
    <div className="min-h-[100dvh] bg-bg font-sans text-text antialiased">
      {screen === 'login'       && <LoginScreen onLogin={doLogin} />}
      {screen === 'dashboard'   && (
        <DashboardScreen
          currentUser={currentUser}
          onMode={openTargetModal}
          onLogout={doLogout}
          onLeaderboard={() => setScreen('leaderboard')}
          showToast={showToast}
        />
      )}
      {screen === 'game' && (
        <GameScreen
          config={gameConfig}
          currentUser={currentUser}
          onEnd={handleGameEnd}
          onQuit={goToDashboard}
          showToast={showToast}
        />
      )}
      {screen === 'result' && (
        <ResultScreen
          result={gameResult}
          onPlayAgain={playAgain}
          onDashboard={goToDashboard}
        />
      )}
      {screen === 'leaderboard' && (
        <LeaderboardScreen
          currentUser={currentUser}
          onBack={goToDashboard}
          showToast={showToast}
        />
      )}

      {showModal && (
        <TargetModal
          mode={pendingMode}
          onConfirm={confirmTarget}
          onClose={() => setShowModal(false)}
          showToast={showToast}
        />
      )}

      {toast && <Toast msg={toast} />}
    </div>
  )
}
