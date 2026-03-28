import ColorPicker from './components/ColorPicker'
import ThemeToggle from './components/ThemeToggle'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

function App() {
  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-svh flex items-center justify-center p-5">
        <ThemeToggle />
        <ColorPicker />
        <Toaster position="top-center" />
      </div>
    </TooltipProvider>
  )
}

export default App
