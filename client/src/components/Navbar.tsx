import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/button'

type NavLink = {
  name: string
  path: string
  authOnly?: boolean
}

const navLinks: NavLink[] = [
  { name: 'Courses', path: '/' },
  { name: 'Dashboard', path: '/dashboard', authOnly: true },
]

function Navbar() {
  const { user, isRestoring, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Condense the bar once the page has scrolled a little.
  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 10)
    }

    handleScroll() // correct on first paint, e.g. a reload halfway down
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Any navigation closes the mobile panel.
  useEffect(() => {
    setIsMenuOpen(false)
  }, [location.key])

  async function handleLogout() {
    await logout()
    navigate('/', { replace: true })
  }

  const visibleLinks = navLinks.filter((link) => !link.authOnly || user)
  const isActive = (path: string) => location.pathname === path

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'border-border border-b bg-background/80 py-3 backdrop-blur-lg'
          : 'border-transparent border-b bg-background py-5'
      }`}
    >
      <div className="mx-auto flex max-w-5xl items-center gap-8 px-4 md:px-8">
        {/* Wordmark */}
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2.5 font-semibold tracking-tight"
        >
          <span className="grid size-7 place-items-center rounded-md bg-primary font-bold text-[11px] text-primary-foreground">
            LMS
          </span>
          <span className="hidden sm:inline">LMS Platform</span>
        </Link>

        {/* Desktop links */}
        <nav className="hidden items-center gap-7 md:flex">
          {visibleLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`group flex flex-col gap-1 text-sm transition-colors ${
                isActive(link.path)
                  ? 'font-medium text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {link.name}
              <span
                className={`h-px bg-foreground transition-all duration-300 ${
                  isActive(link.path) ? 'w-full' : 'w-0 group-hover:w-full'
                }`}
              />
            </Link>
          ))}
        </nav>

        {/* Desktop auth area */}
        <div className="ml-auto hidden items-center gap-3 md:flex">
          {isRestoring ? (
            <span className="text-muted-foreground text-sm">Checking session…</span>
          ) : user ? (
            <>
              <span className="text-muted-foreground text-sm">
                Hi, {user.firstName ?? user.email}
              </span>
              <Button onClick={handleLogout} size="sm" variant="outline">
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button render={<Link to="/login" />} nativeButton={false} size="sm" variant="ghost">
                Log in
              </Button>
              <Button render={<Link to="/signup" />} nativeButton={false} size="sm">
                Sign up
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          aria-expanded={isMenuOpen}
          aria-label="Open menu"
          className="ml-auto text-muted-foreground transition-colors hover:text-foreground md:hidden"
          onClick={() => setIsMenuOpen(true)}
          type="button"
        >
          <svg className="size-6" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
            <line x1="4" x2="20" y1="7" y2="7" />
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="17" y2="17" />
          </svg>
        </button>
      </div>

      {/* Mobile panel */}
      <div
        className={`fixed inset-0 z-50 flex h-screen flex-col gap-7 bg-background px-6 pt-24 transition-transform duration-300 md:hidden ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          aria-label="Close menu"
          className="absolute top-6 right-5 text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => setIsMenuOpen(false)}
          type="button"
        >
          <svg className="size-6" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
            <line x1="18" x2="6" y1="6" y2="18" />
            <line x1="6" x2="18" y1="6" y2="18" />
          </svg>
        </button>

        {visibleLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`text-lg ${isActive(link.path) ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
          >
            {link.name}
          </Link>
        ))}

        <div className="mt-auto mb-12 flex flex-col gap-3">
          {user ? (
            <>
              <span className="text-muted-foreground text-sm">
                Hi, {user.firstName ?? user.email}
              </span>
              <Button onClick={handleLogout} variant="outline">
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button render={<Link to="/login" />} nativeButton={false} variant="outline">
                Log in
              </Button>
              <Button render={<Link to="/signup" />} nativeButton={false}>
                Sign up
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar