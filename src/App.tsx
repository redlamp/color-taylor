import { useEffect, Suspense, lazy } from 'react'
import ErrorBoundary from './components/ErrorBoundary'
import ColorPicker from './components/ColorPicker'
import PluginBanner from './components/PluginBanner'
import FpsMeter from './components/FpsMeter'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider, useTheme } from './hooks/useTheme'
import { SettingsProvider } from './hooks/useSettings'
import { useHashRoute } from './hooks/useHashRoute'
const PresentationShell = lazy(() => import('./presentation/PresentationShell'))

function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <ErrorBoundary>
          <TooltipProvider delay={0}>
            <AppInner />
          </TooltipProvider>
        </ErrorBoundary>
      </SettingsProvider>
    </ThemeProvider>
  )
}

function AppInner() {
  const { route, navigate } = useHashRoute()
  const isPresentation = route.startsWith('#/intro')
  const { setDark, restore } = useTheme()

  // Force dark theme during presentation, restore on exit
  useEffect(() => {
    if (isPresentation) {
      setDark()
    } else {
      restore()
    }
  }, [isPresentation, setDark, restore])

  return (
    <>
      {/* Diagnostic only, on with ?fps in the URL. Above the route switch so it
          reads the deck as well as the picker. */}
      <FpsMeter />
      {/* Background layer that tweens between app and presentation colors */}
      <div
        className="fixed inset-0"
        style={{
          backgroundColor: 'var(--pres-bg-override, ' + (isPresentation ? '#2E424D' : 'var(--background)') + ')',
          transition: 'background-color 0.3s ease-in-out',
        }}
      />
      {isPresentation ? (
        <Suspense fallback={null}>
          <PresentationShell navigate={navigate} />
        </Suspense>
      ) : (
        <div className="relative min-h-svh flex flex-col">
          {/* Fixed to the top of the viewport rather than sitting in the flow:
              it costs the picker no vertical room, so dismissing it does not
              move the tool. Living at app level keeps it off the presentation
              route entirely. */}
          <PluginBanner />
          {/* Named because the pinned menu narrows it - see the
              `[data-menu-pinned]` rule in index.css. */}
          <div id="app-stage" className="flex flex-1 items-center justify-center p-5">
            <ColorPicker />
            <Toaster position="top-center" />
          </div>
        </div>
      )}
    </>
  )
}

export default App
