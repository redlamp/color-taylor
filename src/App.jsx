import ColorPicker from './components/ColorPicker'
import ThemeToggle from './components/ThemeToggle'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from './hooks/useTheme'
import { useHashRoute } from './hooks/useHashRoute'
import PresentationShell from './presentation/PresentationShell'

function App() {
  const { route, navigate } = useHashRoute()
  const isPresentation = route.startsWith('#/presentation')

  return (
    <ThemeProvider>
      <TooltipProvider delayDuration={0}>
        {/* Background layer that tweens between app and presentation colors */}
        <div
          className="fixed inset-0 transition-colors duration-700 ease-in-out"
          style={{ backgroundColor: isPresentation ? '#2E424D' : 'var(--background)' }}
        />
        {isPresentation ? (
          <PresentationShell navigate={navigate} />
        ) : (
          <div className="relative min-h-svh flex items-center justify-center p-5">
            <ThemeToggle />
            <ColorPicker />
            <Toaster position="top-center" />
          </div>
        )}
      </TooltipProvider>
    </ThemeProvider>
  )
}

export default App
