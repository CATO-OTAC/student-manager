export default function Modal({ title, onClose, children, size = 'md' }) {
  const maxW = size === 'lg' ? 'max-w-2xl' : 'max-w-md'
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className={`bg-white w-full sm:rounded-2xl rounded-t-2xl shadow-xl ${maxW} max-h-[90vh] flex flex-col`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sm:rounded-t-2xl rounded-t-2xl shrink-0">
          <h3 className="text-xl font-bold text-slate-900 font-manrope">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
