import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  GameMode,
  GameState,
  EnvironmentTheme,
  GameStats,
  PlayerState,
  UserSaveData,
} from './types/game';
import { VEHICLES, DEFAULT_UPGRADES } from './utils/constants';
import { loadSaveData, saveSaveData } from './utils/storage';
import { sound } from './utils/audio';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { TouchControls } from './components/TouchControls';
import { MainMenu } from './components/MainMenu';
import { GarageModal } from './components/GarageModal';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';

export default function App() {
  const [saveData, setSaveData] = useState<UserSaveData>(loadSaveData);
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [selectedMode, setSelectedMode] = useState<GameMode>('ENDLESS');
  const [selectedTheme, setSelectedTheme] = useState<EnvironmentTheme>('DAY');
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);
  const [gameKey, setGameKey] = useState<number>(0);

  // In-game live HUD stats
  const [liveStats, setLiveStats] = useState<GameStats>({
    score: 0,
    distance: 0,
    coinsCollected: 0,
    nearMisses: 0,
    maxSpeedReached: 0,
    combo: 0,
    comboTimer: 0,
    timeRemaining: 45,
    policeDistance: 65,
  });

  const [livePlayer, setLivePlayer] = useState<PlayerState>({
    x: 0,
    y: 0,
    width: 46,
    height: 88,
    speed: 0,
    targetSpeed: 200,
    maxSpeed: 200,
    acceleration: 25,
    handling: 28,
    nitro: 50,
    maxNitro: 100,
    isNitroActive: false,
    health: 100,
    maxHealth: 100,
    shieldTimer: 0,
    magnetTimer: 0,
    turnDirection: 0,
    isBraking: false,
    invulnerableTimer: 0,
  });

  // Touch and pointer input states
  const [touchInput, setTouchInput] = useState({
    left: false,
    right: false,
    accel: false,
    brake: false,
    nitro: false,
  });

  // Keep sound configuration synced
  useEffect(() => {
    sound.setEnabled(saveData.soundEnabled);
  }, [saveData.soundEnabled]);

  // Persist save data on change
  const handleUpdateSaveData = useCallback(
    (updater: (prev: UserSaveData) => UserSaveData) => {
      setSaveData((prev) => {
        const next = updater(prev);
        saveSaveData(next);
        return next;
      });
    },
    []
  );

  const handleToggleSound = useCallback(() => {
    handleUpdateSaveData((prev) => ({
      ...prev,
      soundEnabled: !prev.soundEnabled,
    }));
  }, [handleUpdateSaveData]);

  // Selected equipped vehicle
  const activeVehicle = useMemo(() => {
    const found = VEHICLES.find((v) => v.id === saveData.selectedVehicleId) || VEHICLES[0];
    const customColor = saveData.vehicleColors[found.id];
    return customColor ? { ...found, color: customColor } : found;
  }, [saveData.selectedVehicleId, saveData.vehicleColors]);

  const activeUpgrades = useMemo(() => {
    return saveData.upgrades[saveData.selectedVehicleId] || { ...DEFAULT_UPGRADES };
  }, [saveData.upgrades, saveData.selectedVehicleId]);

  // Game Start & Restart
  const handleStartGame = () => {
    setGameState('PLAYING');
    setIsNewRecord(false);
    setGameKey((k) => k + 1);
  };

  const handleRestartGame = () => {
    setGameState('PLAYING');
    setIsNewRecord(false);
    setGameKey((k) => k + 1);
  };

  const handlePause = () => {
    if (gameState === 'PLAYING') {
      setGameState('PAUSED');
      sound.stopEngine();
    }
  };

  const handleResume = () => {
    if (gameState === 'PAUSED') {
      setGameState('PLAYING');
      sound.startEngine();
    }
  };

  // Keyboard shortcut for Escape -> Pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (gameState === 'PLAYING') {
          handlePause();
        } else if (gameState === 'PAUSED') {
          handleResume();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Game Over Handler
  const handleGameOver = useCallback(
    (finalStats: GameStats) => {
      setGameState('GAMEOVER');

      // Check for new high score in the active game mode
      const previousHigh = saveData.highScores[selectedMode] || 0;
      const isRecord = finalStats.score > previousHigh;
      setIsNewRecord(isRecord);

      // Save statistics, bank coins, and high score
      handleUpdateSaveData((prev) => {
        const nextHigh = Math.max(prev.highScores[selectedMode] || 0, finalStats.score);
        return {
          ...prev,
          coins: prev.coins + finalStats.coinsCollected,
          highScores: {
            ...prev.highScores,
            [selectedMode]: nextHigh,
          },
          stats: {
            totalDistance: (prev.stats.totalDistance || 0) + finalStats.distance,
            totalGames: (prev.stats.totalGames || 0) + 1,
            totalNearMisses: (prev.stats.totalNearMisses || 0) + finalStats.nearMisses,
          },
        };
      });
    },
    [selectedMode, saveData.highScores, handleUpdateSaveData]
  );

  const handleTouchAction = useCallback(
    (action: 'left' | 'right' | 'accel' | 'brake' | 'nitro', active: boolean) => {
      setTouchInput((prev) => ({
        ...prev,
        [action]: active,
      }));
    },
    []
  );

  const handleStatsUpdate = useCallback(
    (stats: GameStats, player: PlayerState) => {
      setLiveStats(stats);
      setLivePlayer(player);
    },
    []
  );

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* 1. Main Menu View */}
      {gameState === 'MENU' && (
        <MainMenu
          mode={selectedMode}
          onSelectMode={setSelectedMode}
          theme={selectedTheme}
          onSelectTheme={setSelectedTheme}
          saveData={saveData}
          onStartGame={handleStartGame}
          onOpenGarage={() => setGameState('GARAGE')}
          onToggleSound={handleToggleSound}
        />
      )}

      {/* 2. Active Game Canvas & HUD View */}
      {(gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'GAMEOVER') && (
        <div className="relative flex-1 w-full h-full flex flex-col items-center justify-center overflow-hidden">
          {/* Game Canvas Container */}
          <div className="relative w-full h-full flex-1">
            <GameCanvas
              key={gameKey}
              mode={selectedMode}
              theme={selectedTheme}
              vehicle={activeVehicle}
              upgrades={activeUpgrades}
              onGameOver={handleGameOver}
              onStatsUpdate={handleStatsUpdate}
              isPaused={gameState === 'PAUSED' || gameState === 'GAMEOVER'}
              touchInput={touchInput}
            />

            {/* In-Game HUD overlay */}
            <HUD
              mode={selectedMode}
              stats={liveStats}
              player={livePlayer}
              soundEnabled={saveData.soundEnabled}
              onToggleSound={handleToggleSound}
              isPaused={gameState === 'PAUSED'}
              onTogglePause={() => {
                if (gameState === 'PLAYING') handlePause();
                else if (gameState === 'PAUSED') handleResume();
              }}
            />
          </div>

          {/* Touch & On-Screen Pedals (Always interactive, seamlessly supports both touch & mouse) */}
          <div className="w-full shrink-0 bg-slate-950/90 border-t border-slate-900/60 z-20">
            <TouchControls
              onInput={handleTouchAction}
              nitroAvailable={livePlayer.nitro > 10}
            />
          </div>
        </div>
      )}

      {/* 3. Garage & Tuning Shop Modal */}
      {gameState === 'GARAGE' && (
        <GarageModal
          saveData={saveData}
          onUpdateSaveData={handleUpdateSaveData}
          onClose={() => setGameState('MENU')}
        />
      )}

      {/* 4. Pause Modal */}
      {gameState === 'PAUSED' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestartGame}
          onQuit={() => {
            sound.stopEngine();
            setGameState('MENU');
          }}
          soundEnabled={saveData.soundEnabled}
          onToggleSound={handleToggleSound}
        />
      )}

      {/* 5. Game Over Modal */}
      {gameState === 'GAMEOVER' && (
        <GameOverModal
          mode={selectedMode}
          stats={liveStats}
          isNewRecord={isNewRecord}
          onRestart={handleRestartGame}
          onOpenGarage={() => setGameState('GARAGE')}
          onBackToMenu={() => setGameState('MENU')}
        />
      )}
    </div>
  );
}
