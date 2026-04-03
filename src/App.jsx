import { useEffect } from 'react'
import ColorPicker from './components/ColorPicker'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider, useTheme } from './hooks/useTheme'
import { useHashRoute } from './hooks/useHashRoute'
import PresentationShell from './presentation/PresentationShell'

function App() {
  return (
    <ThemeProvider>
      <TooltipProvider delayDuration={0}>
        <AppInner />
      </TooltipProvider>
    </ThemeProvider>
  )
}

function AppInner() {
  const { route, navigate } = useHashRoute()
  const isPresentation = route.startsWith('#/presentation')
  const { setDark, restore } = useTheme()

  // Force dark theme during presentation, restore on exit
  useEffect(() => {
    if (isPresentation) {
      setDark()
    } else {
      restore()
    }
  }, [isPresentation])

  return (
    <>
      {/* Background layer that tweens between app and presentation colors */}
      <div
        className="fixed inset-0"
        style={{
          backgroundColor: 'var(--pres-bg-override, ' + (isPresentation ? '#2E424D' : 'var(--background)') + ')',
          transition: 'background-color 0.3s ease-in-out',
        }}
      />
      {isPresentation ? (
        <PresentationShell navigate={navigate} />
      ) : (
        <div className="relative min-h-svh flex items-center justify-center p-5">
          <ColorPicker />
          <Toaster position="top-center" />
        </div>
      )}
    </>
  )
}

export default App
