import { useState, useEffect, useRef, useCallback } from 'react'
import { sessionsApi } from '../lib/api'
import { TeachNav } from '../components/SectionNav'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const now = new Date()
const DAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

// Xuất PDF bằng window.print() — browser tự render font đúng, không bị lỗi tiếng Việt.
// Trên iPhone: Safari hiện "Lưu vào File" hoặc "AirPrint → PDF".
// Trên Mac app (WKWebView): dùng html2canvas + native save dialog riêng.
function printReceiptHTML(elementIds, filename) {
  // Lấy HTML của một hoặc nhiều receipt elements
  const els = (Array.isArray(elementIds) ? elementIds : [elementIds])
    .map(id => document.getElementById(id))
    .filter(Boolean)
  if (els.length === 0) return

  const receiptHTMLs = els.map(el => `
    <div style="page-break-after: always;">
      ${el.outerHTML}
    </div>
  `).join('')

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>${filename}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=block" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 24px; background: white; }
    @media print {
      body { padding: 0; }
      @page { margin: 8mm; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
  </style>
</head>
<body>
  ${receiptHTMLs}
  <script>
    document.fonts.ready.then(function() { window.print() })
  <\/script>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  if (!win) {
    // Popup bị block (hiếm gặp) — mở trong tab hiện tại
    window.location.href = url
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}

// Chỉ dùng html2canvas khi chạy trong Mac app (WKWebView)
const isNativeApp = () => !!window.webkit?.messageHandlers?.savePDF

async function captureReceipt(el) {
  await document.fonts.ready
  return html2canvas(el, {
    scale: 2.5,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
    onclone: (_doc, clonedEl) => {
      clonedEl.style.fontFamily = 'Inter, Arial, sans-serif'
    },
  })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isExtraDate = (d) => d.startsWith('extra:')
const stripExtra = (d) => isExtraDate(d) ? d.slice(6) : d       // remove prefix
const getDatePart = (d) => stripExtra(d).slice(0, 10)
const getTimePart = (d) => stripExtra(d).length > 10 ? stripExtra(d).slice(11) : null

function parseDateChip(dateStr) {
  const dp = getDatePart(dateStr)
  const time = isExtraDate(dateStr) ? getTimePart(dateStr) : null  // only show time for extras
  const d = new Date(dp + 'T00:00:00')
  return { day: d.getDate(), month: d.getMonth() + 1, dayName: DAY_NAMES[d.getDay()], time, isExtra: isExtraDate(dateStr) }
}

// Sort dates by calendar order (stripping prefix first)
function sortDates(dates) {
  return [...dates].sort((a, b) => stripExtra(a).localeCompare(stripExtra(b)))
}

// ─── Receipt (100% inline styles → preview === PDF) ───────────────────────────

function ReceiptContent({ session, month, year, id }) {
  const fee = session.students?.fee_per_session || 0
  const dates = sortDates(Array.isArray(session.dates) ? session.dates : [])

  const BASE = { fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif" }

  return (
    <div id={id} style={{ ...BASE, backgroundColor: '#ffffff', width: '560px', padding: '48px', boxSizing: 'border-box' }}>

      {/* ── Header ── */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{ display: 'inline-block', borderBottom: '3px solid #1e3a5f', paddingBottom: '16px', width: '100%' }}>
          <h1 style={{ ...BASE, fontSize: '22px', fontWeight: '900', letterSpacing: '3px', color: '#1e3a5f', margin: '0 0 6px', textTransform: 'uppercase' }}>
            Phiếu Thu Học Phí
          </h1>
          <p style={{ ...BASE, fontSize: '14px', color: '#64748b', margin: 0, fontWeight: '500' }}>
            Tháng {month}/{year}
          </p>
        </div>
      </div>

      {/* ── Student info ── */}
      <div style={{ backgroundColor: '#f8fafc', borderRadius: '10px', padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ ...BASE, fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Học sinh:</span>
          <span style={{ ...BASE, fontSize: '17px', fontWeight: '800', color: '#1e3a5f' }}>{session.students?.name}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ ...BASE, fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Lớp:</span>
          <span style={{ ...BASE, fontSize: '14px', fontWeight: '600', color: '#334155' }}>{session.students?.class_name || '—'}</span>
        </div>
      </div>

      {/* ── Dates ── */}
      {dates.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <p style={{ ...BASE, fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '12px' }}>
            Các buổi đã học ({dates.length} buổi)
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
            {dates.map(d => {
              const { day, month: m, dayName, time, isExtra } = parseDateChip(d)
              return (
                <div key={d} style={{
                  backgroundColor: isExtra ? '#fffbeb' : '#eff6ff',
                  border: isExtra ? '1.5px solid #fcd34d' : '1.5px solid #bfdbfe',
                  borderRadius: '8px',
                  padding: '8px 4px',
                  textAlign: 'center',
                }}>
                  <div style={{ ...BASE, fontSize: '9px', fontWeight: '700', color: isExtra ? '#b45309' : '#1d4ed8', letterSpacing: '0.5px' }}>
                    {dayName}
                  </div>
                  <div style={{ ...BASE, fontSize: '15px', fontWeight: '900', color: isExtra ? '#b45309' : '#1d4ed8', lineHeight: '1.2' }}>
                    {day}/{m}
                  </div>
                  {time && (
                    <div style={{ ...BASE, fontSize: '9px', fontWeight: '700', color: isExtra ? '#b45309' : '#1d4ed8', marginTop: '2px' }}>
                      {time}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Summary ── */}
      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginBottom: '20px' }}>
        {[
          ['Số buổi học:', `${session.session_count} buổi`],
          ['Học phí / buổi:', `${fee.toLocaleString('vi-VN')}đ`],
          ...(session.notes ? [['Ghi chú:', session.notes]] : []),
        ].map(([label, value]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ ...BASE, fontSize: '13px', color: '#64748b' }}>{label}</span>
            <span style={{ ...BASE, fontSize: '13px', fontWeight: '700', color: '#334155' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* ── Total ── */}
      <div style={{ borderTop: '2.5px solid #1e3a5f', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ ...BASE, fontSize: '15px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', color: '#1e3a5f' }}>
          Tổng cộng:
        </span>
        <span style={{ ...BASE, fontSize: '28px', fontWeight: '900', color: '#855300' }}>
          {(session.amount || 0).toLocaleString('vi-VN')}đ
        </span>
      </div>

    </div>
  )
}

// ─── Receipt detail modal ─────────────────────────────────────────────────────

function ReceiptModal({ session, month, year, onClose }) {
  const [exporting, setExporting] = useState(false)
  const previewRef = useRef(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = previewRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      const available = el.offsetWidth - 48 // padding
      setScale(Math.min(1, available / 560))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const exportSingle = async () => {
    setExporting(true)
    const filename = `phieu-${(session.students?.name || 'hs').replace(/\s+/g, '-')}-t${month}-${year}.pdf`
    try {
      if (isNativeApp()) {
        // Mac Aymond app: html2canvas + native save dialog
        const el = document.getElementById('receipt-modal-inner')
        if (!el) return
        const canvas = await captureReceipt(el)
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
        const imgData = canvas.toDataURL('image/png')
        const imgWidth = 190
        const imgHeight = (canvas.height * imgWidth) / canvas.width
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight)
        window.webkit.messageHandlers.savePDF.postMessage({ data: pdf.output('datauristring'), filename })
      } else {
        // Web / iPhone: mở tab mới + window.print() — font đúng 100%
        printReceiptHTML('receipt-modal-inner', filename)
      }
    } finally {
      setExporting(false)
    }
  }

  return (
    // Overlay scrollable — modal không bị giới hạn chiều cao, scroll toàn trang nếu cần
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] overflow-y-auto"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="flex justify-center min-h-full sm:p-4 sm:py-8">
        <div className="bg-white sm:rounded-2xl shadow-xl w-full max-w-2xl h-fit sm:h-fit" style={{ marginTop: 'env(safe-area-inset-top)' }}>

          {/* Header */}
          <div className="sticky top-0 px-4 sm:px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white sm:rounded-t-2xl z-10">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-manrope">Phiếu học phí</h3>
              <p className="text-sm text-slate-500">{session.students?.name} · T{month}/{year}</p>
            </div>
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Preview — scale để vừa màn hình */}
          <div ref={previewRef} className="flex justify-center p-6 bg-slate-100">
            <div style={{
              transformOrigin: 'top center',
              transform: `scale(${scale})`,
              marginBottom: scale < 1 ? `calc((${scale} - 1) * 100%)` : 0,
            }}>
              <div style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}>
                <ReceiptContent session={session} month={month} year={year} id="receipt-modal-inner" />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-6 py-4 border-t border-slate-100 bg-white sm:rounded-b-2xl flex items-center gap-3"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
            <button onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 text-sm">
              Đóng
            </button>
            <button onClick={exportSingle} disabled={exporting}
              className="flex-1 sm:flex-none bg-primary text-white py-2.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-primary/30 disabled:opacity-50">
              <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
              {exporting ? 'Đang xuất...' : 'Xuất PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Receipts() {
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [sessions, setSessions] = useState([])
  const [selected, setSelected] = useState(null)
  const [printingAll, setPrintingAll] = useState(false)
  const hiddenRef = useRef(null)

  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1]

  useEffect(() => {
    sessionsApi.getByMonth(month, year).then(setSessions)
  }, [month, year])

  const totalIncome = sessions.reduce((s, x) => s + (x.amount || 0), 0)

  const exportAll = async () => {
    if (sessions.length === 0) return
    setPrintingAll(true)
    const filename = `phieu-hoc-phi-thang-${month}-${year}.pdf`
    try {
      if (isNativeApp() && hiddenRef.current) {
        // Mac Aymond app: html2canvas từng trang
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
        const items = hiddenRef.current.querySelectorAll('.receipt-item')
        for (let i = 0; i < items.length; i++) {
          const canvas = await captureReceipt(items[i])
          const imgData = canvas.toDataURL('image/png')
          const imgWidth = 190
          const imgHeight = (canvas.height * imgWidth) / canvas.width
          if (i > 0) pdf.addPage()
          pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight)
        }
        window.webkit.messageHandlers.savePDF.postMessage({ data: pdf.output('datauristring'), filename })
      } else {
        // Web / iPhone: tất cả phiếu trong 1 tab, print → PDF nhiều trang
        const ids = sessions.map(s => `export-${s.id}`)
        printReceiptHTML(ids, filename)
      }
    } finally {
      setPrintingAll(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <TeachNav />
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900 font-manrope mb-3">Phiếu học phí</h1>
        <div className="flex items-center gap-2">
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-base sm:text-sm bg-white font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
            {months.map(m => <option key={m} value={m}>Tháng {m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="w-24 border border-slate-200 rounded-xl px-3 py-2.5 text-base sm:text-sm bg-white font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={exportAll} disabled={sessions.length === 0 || printingAll}
            className="bg-primary text-white py-2.5 px-4 rounded-xl font-bold text-sm flex items-center gap-1.5 shadow-md shadow-primary/20 hover:opacity-90 disabled:opacity-50 shrink-0">
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
            <span className="hidden sm:inline">{printingAll ? 'Đang xuất...' : 'Xuất tất cả'}</span>
            <span className="sm:hidden">{printingAll ? '...' : 'PDF'}</span>
          </button>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-16 text-center border border-slate-200">
          <span className="material-symbols-outlined text-5xl text-slate-300 block mb-3">receipt_long</span>
          <p className="text-slate-400">Chưa có dữ liệu điểm danh tháng {month}/{year}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 font-manrope">
              Tháng {month}/{year} · {sessions.length} học sinh
            </h2>
            <span className="font-black text-lg text-secondary font-manrope">{totalIncome.toLocaleString('vi-VN')}đ</span>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3.5 text-[10px] uppercase tracking-widest font-bold text-slate-500">Học sinh</th>
                <th className="px-4 py-3.5 text-[10px] uppercase tracking-widest font-bold text-slate-500 hidden sm:table-cell">Lớp</th>
                <th className="px-4 py-3.5 text-[10px] uppercase tracking-widest font-bold text-slate-500 hidden md:table-cell">Ngày học</th>
                <th className="px-4 py-3.5 text-right text-[10px] uppercase tracking-widest font-bold text-slate-500">Buổi</th>
                <th className="px-4 py-3.5 text-right text-[10px] uppercase tracking-widest font-bold text-slate-500">Học phí</th>
                <th className="px-4 py-3.5 text-center text-[10px] uppercase tracking-widest font-bold text-slate-500">Phiếu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sessions.map(s => {
                const dates = sortDates(Array.isArray(s.dates) ? s.dates : [])
                return (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors duration-150">
                    <td className="px-4 py-3.5 font-bold text-slate-900 text-sm">{s.students?.name}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-500 hidden sm:table-cell">{s.students?.class_name || '—'}</td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      {dates.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {dates.map(d => {
                            const { day, dayName, time, isExtra } = parseDateChip(d)
                            return (
                              <span key={d} className={`text-xs px-1.5 py-0.5 rounded font-bold border ${isExtra ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-primary border-blue-100'
                                }`}>
                                {dayName} {day}{time ? ` ${time}` : ''}
                              </span>
                            )
                          })}
                        </div>
                      ) : <span className="text-slate-400 text-sm">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-slate-700 text-sm">{s.session_count}</td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="font-bold text-sm text-secondary bg-secondary-container/20 px-2.5 py-1 rounded-full whitespace-nowrap">
                        {(s.amount || 0).toLocaleString('vi-VN')}đ
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => setSelected(s)}
                        className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
                        <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                        Xem
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">{sessions.length} phiếu · Tháng {month}/{year}</span>
            <span className="font-black text-secondary font-manrope">{totalIncome.toLocaleString('vi-VN')}đ</span>
          </div>
        </div>
      )}

      {/* Hidden area for bulk export — cùng ReceiptContent, scale đồng nhất */}
      <div ref={hiddenRef} style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1 }} aria-hidden="true">
        {sessions.map(s => (
          <div key={s.id} className="receipt-item">
            <ReceiptContent session={s} month={month} year={year} id={`export-${s.id}`} />
          </div>
        ))}
      </div>

      {selected && (
        <ReceiptModal session={selected} month={month} year={year} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
