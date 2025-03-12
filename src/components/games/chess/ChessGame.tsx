import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { Card } from '../../ui/Card';
import Button from '../../ui/Button';
import { Crown, Clock, RotateCcw, Share2, Copy, Users, Brain } from 'lucide-react';
import { ShareButton } from '../../ui/ShareButton';
import toast from 'react-hot-toast';
import { nanoid } from 'nanoid';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

interface GameState {
  fen: string;
  lastMove: string | null;
  timeWhite: number;
  timeBlack: number;
}

const ChessGame: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { gameId } = useParams();
  const [game, setGame] = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<string[]>([]);
  const [gameStatus, setGameStatus] = useState<string>('');
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');
  const [timeWhite, setTimeWhite] = useState(600);
  const [timeBlack, setTimeBlack] = useState(600);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');
  const [gameMode, setGameMode] = useState<'ai' | 'multiplayer' | 'local'>('local');
  const [aiLevel, setAiLevel] = useState(10);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    if (gameId) {
      joinGame(gameId);
    }
  }, [gameId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && !game.isGameOver()) {
      interval = setInterval(() => {
        if (game.turn() === 'w') {
          setTimeWhite((prev) => Math.max(0, prev - 1));
        } else {
          setTimeBlack((prev) => Math.max(0, prev - 1));
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, game]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const createGame = async () => {
    const newGameId = nanoid();
    const { data, error } = await supabase
      .from('games')
      .insert({
        id: newGameId,
        game_type: 'chess',
        status: 'waiting',
        metadata: {
          fen: game.fen(),
          created_by: user?.id
        }
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create game');
      return;
    }

    const channel = supabase.channel(`game:${newGameId}`);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        navigate(`/chess/${newGameId}`);
        setWaitingForOpponent(true);
      }
    });

    return newGameId;
  };

  const joinGame = async (gameId: string) => {
    const { data: gameData, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (error || !gameData) {
      toast.error('Game not found');
      return;
    }

    const { error: joinError } = await supabase
      .from('game_participants')
      .insert({
        game_id: gameId,
        user_id: user?.id,
        role: 'player'
      });

    if (joinError) {
      toast.error('Failed to join game');
      return;
    }

    const channel = supabase.channel(`game:${gameId}`);
    channel.on('presence', { event: 'sync' }, () => {
      const presenceState = channel.presenceState();
      if (Object.keys(presenceState).length === 2) {
        setWaitingForOpponent(false);
        startGame();
      }
    }).subscribe();

    if (gameData.metadata?.fen) {
      const newGame = new Chess(gameData.metadata.fen);
      setGame(newGame);
      setMoveHistory(gameData.metadata.moves || []);
    }
  };

  const makeMove = (from: string, to: string) => {
    try {
      const move = game.move({
        from,
        to,
        promotion: 'q'
      });

      if (move) {
        setMoveHistory((prev) => [...prev, move.san]);
        setIsTimerRunning(true);

        if (gameId) {
          supabase.channel(`game:${gameId}`).send({
            type: 'broadcast',
            event: 'move',
            payload: { from, to }
          });
        }

        if (game.isGameOver()) {
          handleGameOver();
        }
      }
    } catch (error) {
      console.error('Invalid move:', error);
    }
  };

  const handleSquareClick = (square: string) => {
    if (!selectedSquare) {
      const piece = game.get(square);
      if (piece && piece.color === playerColor) {
        setSelectedSquare(square);
        setPossibleMoves(
          game.moves({ square, verbose: true }).map((move) => move.to)
        );
      }
    } else {
      if (possibleMoves.includes(square)) {
        makeMove(selectedSquare, square);
      }
      setSelectedSquare(null);
      setPossibleMoves([]);
    }
  };

  const handleGameOver = async () => {
    setIsTimerRunning(false);
    let status = '';
    if (game.isCheckmate()) status = 'Checkmate!';
    else if (game.isDraw()) status = 'Draw!';
    else if (game.isStalemate()) status = 'Stalemate!';
    else if (game.isThreefoldRepetition()) status = 'Draw by repetition!';
    else if (game.isInsufficientMaterial()) status = 'Draw by insufficient material!';
    setGameStatus(status);

    try {
      const { data, error } = await supabase
        .from('games')
        .insert([{
          game_type: 'chess',
          status: 'completed',
          winner_id: game.turn() === 'w' ? null : user?.id,
          metadata: {
            pgn: game.pgn(),
            moves: moveHistory,
            final_position: game.fen()
          }
        }])
        .select()
        .single();

      if (error) throw error;
      toast.success('Game recorded successfully!');
    } catch (error) {
      console.error('Error recording game:', error);
      toast.error('Failed to record game');
    }
  };

  const startAnalysis = () => {
    setIsAnalyzing(true);
    setAnalysis('Analysis feature has been removed');
    setTimeout(() => setIsAnalyzing(false), 2000);
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/chess/${gameId}`;
    navigator.clipboard.writeText(link);
    toast.success('Invite link copied to clipboard!');
  };

  const resetGame = () => {
    setGame(new Chess());
    setSelectedSquare(null);
    setPossibleMoves([]);
    setGameStatus('');
    setMoveHistory([]);
    setTimeWhite(600);
    setTimeBlack(600);
    setIsTimerRunning(false);
  };

  const renderSquare = (position: string, index: number) => {
    const piece = game.get(position);
    const isSelected = selectedSquare === position;
    const isPossibleMove = possibleMoves.includes(position);
    const isDark = (Math.floor(index / 8) + index) % 2 === 1;

    return (
      <motion.div
        key={position}
        className={`
          relative w-12 h-12 flex items-center justify-center
          ${isDark ? 'bg-gray-700' : 'bg-gray-500'}
          ${isSelected ? 'ring-2 ring-yellow-400' : ''}
          ${isPossibleMove ? 'ring-2 ring-green-400' : ''}
          cursor-pointer
          hover:opacity-90
          transition-all duration-200
        `}
        onClick={() => handleSquareClick(position)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {piece && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`text-3xl ${piece.color === 'w' ? 'text-white' : 'text-black'}`}
          >
            {getPieceSymbol(piece.type)}
          </motion.div>
        )}
        {isPossibleMove && !piece && (
          <div className="absolute w-3 h-3 bg-green-400 rounded-full opacity-50" />
        )}
      </motion.div>
    );
  };

  const getPieceSymbol = (piece: string): string => {
    const pieces: { [key: string]: string } = {
      p: '♟',
      n: '♞',
      b: '♝',
      r: '♜',
      q: '♛',
      k: '♚',
    };
    return pieces[piece] || '';
  };

  const boardSquares = Array(64)
    .fill(null)
    .map((_, i) => {
      const row = 8 - Math.floor(i / 8);
      const col = String.fromCharCode(97 + (i % 8));
      return `${col}${row}`;
    });

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-1 space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Crown className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold">Chess</h2>
            </div>
            <div className="flex items-center space-x-4">
              {!gameId && (
                <Button
                  onClick={() => createGame()}
                  className="flex items-center space-x-2"
                >
                  <Users className="w-4 h-4" />
                  <span>Create Game</span>
                </Button>
              )}
              {gameId && waitingForOpponent && (
                <Button
                  onClick={copyInviteLink}
                  className="flex items-center space-x-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Invite Link</span>
                </Button>
              )}
              <Button
                onClick={startAnalysis}
                disabled={isAnalyzing}
                className="flex items-center space-x-2"
              >
                <Brain className="w-4 h-4" />
                <span>{isAnalyzing ? 'Analyzing...' : 'Analyze'}</span>
              </Button>
              <Button
                onClick={resetGame}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span className="font-mono text-xl">
                {formatTime(game.turn() === 'w' ? timeWhite : timeBlack)}
              </span>
            </div>
            {gameStatus && (
              <div className="flex items-center space-x-4">
                <span className="text-lg font-bold text-primary">{gameStatus}</span>
                <ShareButton
                  title="Chess Game"
                  winAmount={0}
                  gameType="chess"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-8 gap-0 max-w-[384px] mx-auto border-2 border-gray-600">
            {boardSquares.map((pos, i) => renderSquare(pos, i))}
          </div>

          {isAnalyzing && (
            <div className="mt-4 p-4 bg-surface/60 rounded-lg">
              <p className="font-mono">{analysis}</p>
            </div>
          )}
        </Card>
      </div>

      <Card className="p-6 w-full lg:w-80">
        <h3 className="text-lg font-bold mb-4">Move History</h3>
        <div className="h-[400px] overflow-y-auto space-y-2">
          {moveHistory.map((move, i) => (
            <div
              key={i}
              className="flex items-center space-x-2 p-2 bg-surface/60 rounded-lg"
            >
              <span className="text-text/60">{i + 1}.</span>
              <span className="font-mono">{move}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ChessGame;