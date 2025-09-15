import DuckGame from './components/DuckGame';
function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-green-600">
      <h1 className="text-4xl font-bold text-white mb-6">Atrapa al Pato</h1>
      <DuckGame defaultPlayerName="Bruno" />
    </div>
  );
}

export default App;
