import ColorPicker from './components/ColorPicker'
import ThemeToggle from './components/ThemeToggle'
import { Toaster } from '@/components/ui/sonner'

function App() {
  return (
    <div className="min-h-svh flex items-center justify-center p-5">
      <ThemeToggle />
      <ColorPicker />
      <Toaster position="top-center" />
    </div>
  )
}

export default App
