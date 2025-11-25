import { WalletConnect } from './components/WalletConnect'
import { MintForm } from './components/MintForm'
import { Gallery } from './components/Gallery'

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <header className="p-4 border-b border-gray-800">
        <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
          BCH NFT Manager
        </h1>
      </header>
      <main className="container mx-auto p-4 space-y-8">
        <WalletConnect />
        <MintForm />
        <Gallery />
      </main>
    </div>
  )
}

export default App
