import React, { useEffect, useState } from 'react';
import { fetchLiveScores, fetchGameStats, fetchDailyLeaders } from '../utils/api';

const LiveScores = () => {
  const [scores, setScores] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState(null);
  const [gameStats, setGameStats] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const [liveScores, dailyLeaders] = await Promise.all([
        fetchLiveScores(),
        fetchDailyLeaders()
      ]);
      setScores(liveScores);
      setLeaders(dailyLeaders);
      setLoading(false);
    };
    fetchData();

    // Refresh data every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleGameClick = async (gameId) => {
    const stats = await fetchGameStats(gameId);
    setSelectedGame(gameId);
    setGameStats(stats);
  };

  if (loading) return <div className="text-center py-10">Loading scores and stats...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">NHL Live Scores</h1>
      
      {/* Games Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {scores.map((game) => (
          <div 
            key={game.GameID} 
            className={`border p-4 rounded-lg shadow-md cursor-pointer transition-all ${
              selectedGame === game.GameID ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => handleGameClick(game.GameID)}
          >
            <h2 className="text-lg font-semibold">
              {game.AwayTeam} vs {game.HomeTeam}
            </h2>
            <p className="mt-2">
              <strong>Status:</strong> {game.Status}
              {game.Period && ` - Period ${game.Period} (${game.TimeRemaining})`}
            </p>
            <p>
              <strong>Score:</strong> {game.AwayScore} - {game.HomeScore}
            </p>
            <p>
              <strong>Shots on Goal:</strong> {game.AwaySOG} - {game.HomeSOG}
            </p>
          </div>
        ))}
      </div>

      {/* Game Stats */}
      {gameStats && (
        <div className="mb-8 p-4 border rounded-lg">
          <h2 className="text-xl font-bold mb-4">Game Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['away', 'home'].map((team) => (
              <div key={team} className="border p-4 rounded">
                <h3 className="text-lg font-semibold mb-2">{gameStats[team].team}</h3>
                <div className="space-y-2">
                  <p><strong>Shots:</strong> {gameStats[team].stats.shots}</p>
                  <p><strong>Hits:</strong> {gameStats[team].stats.hits}</p>
                  <p><strong>Blocked Shots:</strong> {gameStats[team].stats.blocked}</p>
                  <p><strong>Face-off Wins:</strong> {gameStats[team].stats.faceOffWinPercentage}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Leaders */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Tonight's Leaders</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2">Player</th>
                <th className="px-4 py-2">Position</th>
                <th className="px-4 py-2">Goals</th>
                <th className="px-4 py-2">Assists</th>
                <th className="px-4 py-2">Points</th>
                <th className="px-4 py-2">Shots</th>
              </tr>
            </thead>
            <tbody>
              {leaders.map((player, index) => (
                <tr key={index} className={index % 2 ? 'bg-gray-50' : ''}>
                  <td className="px-4 py-2">{player.name}</td>
                  <td className="px-4 py-2">{player.position}</td>
                  <td className="px-4 py-2">{player.goals}</td>
                  <td className="px-4 py-2">{player.assists}</td>
                  <td className="px-4 py-2">{player.points}</td>
                  <td className="px-4 py-2">{player.shots}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LiveScores;
