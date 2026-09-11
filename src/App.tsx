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
import { CAMERA_ID } from './demo/camera'
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
      {/* The camera's wrapper. Nothing is on it until a `camera` cue in a
          video script scales and slides it (src/demo/camera.ts); the ghost
          cursor, the script's drawn callouts and presentation mode's
          transport are all portalled to <body>, outside it, so a push-in
          moves the app and leaves the recording's furniture alone. */}
      <div id={CAMERA_ID}>
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
          <div id="app-stage" className="flex flex-1 items-center justify-center px-5 py-5 sm:py-0">
            <ColorPicker />
            <Toaster position="top-center" />
          </div>
        </div>
      )}
      </div>
    </>
  )
}

export default App
