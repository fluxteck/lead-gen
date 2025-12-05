import NavBar from './NavBar'
export default function Layout({ children, theme, toggleTheme }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050505] to-black dark:from-white dark:to-gray-100 text-white dark:text-black">
      <main className="container mx-auto px-6 py-20">
        {children}
      </main>
      <NavBar theme={theme} toggleTheme={toggleTheme} />
    </div>
  )
}
