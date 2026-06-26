export default function Toast({ msg }) {
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-bg3 border border-border-r text-text px-5 py-2.5 rounded-lg text-[13px] z-[200] whitespace-nowrap pointer-events-none animate-toastIn">
      {msg}
    </div>
  )
}
