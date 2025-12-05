export default function ActionCard({title, children}) {
  return (
    <div className="glass p-6 rounded-2xl border border-white/10 shadow-xl max-w-xl mx-auto">
      <h3 className="text-xl font-extrabold tracking-tight mb-3">{title}</h3>
      {children}
    </div>
  )
}
