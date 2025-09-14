import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import patitoGif from '../assets/PatoTransparente.gif';
import graznido from '../assets/Graznido.mp3';
import { motion } from 'framer-motion';

const DUCK_SIZE = 64;
const BASE_TIME = 30;
const BASE_SPEED = 80;

function getRandomPosition(maxWidth: number, maxHeight: number) {
  // Dejar margen para que el pato nunca se salga
  const margin = 8;
  const x = Math.random() * (maxWidth - DUCK_SIZE - margin * 2) + margin;
  const y = Math.random() * (maxHeight - DUCK_SIZE - margin * 2) + margin;
  return { x, y };
}

const DuckGame: React.FC = () => {
  const [screen, setScreen] = useState<'start' | 'playing' | 'win' | 'lose' | 'scores'>('start');
  const [scores, setScores] = useState<{ name: string; level: number; date: string }[]>([]);
  const [loadingScores, setLoadingScores] = useState(false);
  // Consultar puntuaciones
  const fetchScores = async () => {
    setLoadingScores(true);
    try {
  const res = await axios.get('https://pato-63re.onrender.com/api/achievements');
      setScores(res.data);
    } catch (err) {
      setScores([]);
    }
    setLoadingScores(false);
  };
  const [level, setLevel] = useState(1);
  const [playerName, setPlayerName] = useState('Jugador');
  const [editingName, setEditingName] = useState(false);
  const [timer, setTimer] = useState(BASE_TIME);
  const [ducks, setDucks] = useState([
    { x: 100, y: 100, direction: 'right', id: 0, alive: true }
  ]);
  const [speed, setSpeed] = useState(BASE_SPEED);
  const gameAreaRef = useRef<HTMLDivElement>(null);

  // Movimiento continuo de todos los patos
  useEffect(() => {
    if (screen !== 'playing') return;
    const interval = setInterval(() => {
      setDucks((prev) =>
        prev.map((duck) => {
          if (!duck.alive) return duck;
          if (gameAreaRef.current) {
            const { offsetWidth, offsetHeight } = gameAreaRef.current;
            const newPos = getRandomPosition(offsetWidth, offsetHeight);
            return {
              ...duck,
              x: newPos.x,
              y: newPos.y,
              direction: newPos.x > duck.x ? 'right' : 'left',
            };
          }
          return duck;
        })
      );
    }, Math.max(1000 / speed, 20)); // Intervalo ajustado por velocidad
    return () => clearInterval(interval);
  }, [screen, speed]);

  // Cronómetro
  useEffect(() => {
    if (screen !== 'playing') return;
    if (timer === 0) {
      setScreen('lose');
      return;
    }
    const t = setTimeout(() => setTimer(timer - 1), 1000);
    return () => clearTimeout(t);
  }, [timer, screen]);

  // Click en un pato
  const handleDuckClick = (id: number) => {
    setDucks((prev) => prev.map((duck) => duck.id === id ? { ...duck, alive: false } : duck));
    const audio = new Audio(graznido);
    audio.play();
    // Si todos los patos han sido atrapados, gana el nivel
    setTimeout(() => {
      if (ducks.filter((d) => d.alive).length === 1) {
        setScreen('win');
      }
    }, 200);
  };

  // Iniciar nivel
  const startLevel = () => {
    setScreen('playing');
    setTimer(BASE_TIME + (level - 1) * 10);
    setSpeed(BASE_SPEED * Math.pow(1.1, level - 1));
    setDucks(
      Array.from({ length: level }, (_, i) => {
        if (gameAreaRef.current) {
          const { offsetWidth, offsetHeight } = gameAreaRef.current;
          const pos = getRandomPosition(offsetWidth, offsetHeight);
          return { x: pos.x, y: pos.y, direction: 'right', id: i, alive: true };
        }
        return { x: 100, y: 100, direction: 'right', id: i, alive: true };
      })
    );
  };

  // Siguiente nivel
  const nextLevel = () => {
    setLevel(level + 1);
    setScreen('start');
  };

  // Reiniciar juego
  const restartGame = () => {
    setLevel(1);
    setScreen('start');
  };

  // Guardar logro en backend
  const saveAchievement = async () => {
    try {
  const res = await axios.post('https://pato-63re.onrender.com/api/achievements', {
        name: playerName,
        level,
      });
      if (res.data && res.data.success) {
        alert('¡Logro guardado exitosamente!');
      } else {
        alert('No se pudo guardar el logro.');
      }
    } catch (err) {
  alert('Error guardando logro: ' + (err instanceof Error ? err.message : JSON.stringify(err)));
      console.error('Error guardando logro', err);
    }
  };

  return (
  <div ref={gameAreaRef} className="relative w-full h-[500px] bg-green-600 rounded-lg overflow-hidden">
      {/* Pantalla de inicio y edición de nombre */}
      {screen === 'start' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-80">
          <h2 className="text-2xl font-bold mb-2">Nivel {level}</h2>
          <div className="mb-4">
            {editingName ? (
              <input
                className="border rounded px-2 py-1"
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                onBlur={() => setEditingName(false)}
                autoFocus
              />
            ) : (
              <span className="font-bold">Jugador: {playerName} </span>
            )}
            <button className="ml-2 text-blue-500 underline" onClick={() => setEditingName(true)}>Editar</button>
          </div>
          <button className="px-4 py-2 bg-green-500 text-white rounded mb-2" onClick={startLevel}>Iniciar</button>
          <button className="px-4 py-2 bg-yellow-500 text-white rounded" onClick={() => { fetchScores(); setScreen('scores'); }}>Ver puntuaciones</button>
        </div>
      )}
      {/* Pantalla de puntuaciones */}
      {screen === 'scores' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-90">
          <h2 className="text-2xl font-bold mb-4">Puntuaciones</h2>
          {loadingScores ? (
            <div>Cargando...</div>
          ) : scores.length === 0 ? (
            <div>No hay puntuaciones registradas.</div>
          ) : (
            <div className="max-h-80 overflow-y-auto w-full px-4">
              <table className="w-full text-left border">
                <thead>
                  <tr>
                    <th className="border px-2">Jugador</th>
                    <th className="border px-2">Nivel</th>
                    <th className="border px-2">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {scores.map((score, idx) => (
                    <tr key={idx}>
                      <td className="border px-2">{score.name}</td>
                      <td className="border px-2">{score.level}</td>
                      <td className="border px-2">{new Date(score.date).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded" onClick={() => setScreen('start')}>Volver</button>
        </div>
      )}
      {/* Pantalla de juego */}
      {screen === 'playing' && (
        <>
          <div className="absolute top-4 right-4 text-xl font-bold">
            ⏰ {timer}s
          </div>
          {ducks.map((duck) => duck.alive && (
            <motion.img
              key={duck.id}
              src={patitoGif}
              alt="Pato"
              width={DUCK_SIZE}
              height={DUCK_SIZE}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                cursor: 'pointer',
                transform: duck.direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)'
              }}
              onClick={() => handleDuckClick(duck.id)}
              animate={{ x: duck.x, y: duck.y, scale: 1 }}
              transition={{ x: { type: 'spring', stiffness: speed }, y: { type: 'spring', stiffness: speed } }}
              onAnimationComplete={() => {
                if (screen === 'playing' && duck.alive) {
                  if (gameAreaRef.current) {
                    const { offsetWidth, offsetHeight } = gameAreaRef.current;
                    const newPos = getRandomPosition(offsetWidth, offsetHeight);
                    setDucks((prev) => prev.map(d => d.id === duck.id ? {
                      ...d,
                      x: newPos.x,
                      y: newPos.y,
                      direction: newPos.x > d.x ? 'right' : 'left',
                    } : d));
                  }
                }
              }}
            />
          ))}
        </>
      )}
      {/* Pantalla de victoria */}
      {screen === 'win' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-80">
          <h2 className="text-2xl font-bold text-green-600 mb-2">¡Ganaste el nivel {level}! 🦆</h2>
          <button className="px-4 py-2 bg-green-500 text-white rounded mb-2" onClick={nextLevel}>Siguiente nivel</button>
          <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={restartGame}>Iniciar juego</button>
          <button className="px-4 py-2 bg-gray-500 text-white rounded mt-2" onClick={saveAchievement}>Guardar logro</button>
        </div>
      )}
      {/* Pantalla de derrota */}
      {screen === 'lose' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-80">
          <h2 className="text-2xl font-bold text-red-600 mb-2">¡Perdiste en el nivel {level}! 😢</h2>
          <button className="px-4 py-2 bg-blue-500 text-white rounded mb-2" onClick={restartGame}>Iniciar juego</button>
          <button className="px-4 py-2 bg-gray-500 text-white rounded" onClick={saveAchievement}>Guardar logro</button>
        </div>
      )}
    </div>
  );
};

export default DuckGame;
