import axios from 'axios';

const API_BASE_URL = 'https://statsapi.web.nhl.com/api/v1';

export const fetchLiveScores = async () => {
  try {
    // Fetch today's games
    const response = await axios.get(`${API_BASE_URL}/schedule?expand=schedule.linescore`);
    const games = response.data.dates[0]?.games || [];
    
    // Transform the data to match our existing structure
    const transformedGames = games.map(game => ({
      GameID: game.gamePk,
      AwayTeam: game.teams.away.team.name,
      HomeTeam: game.teams.home.team.name,
      AwayScore: game.teams.away.score,
      HomeScore: game.teams.home.score,
      Status: game.status.detailedState,
      Period: game.linescore?.currentPeriod,
      TimeRemaining: game.linescore?.currentPeriodTimeRemaining,
      AwaySOG: game.linescore?.teams?.away?.shotsOnGoal || 0,
      HomeSOG: game.linescore?.teams?.home?.shotsOnGoal || 0
    }));

    return transformedGames;
  } catch (error) {
    console.error('Error fetching scores:', error);
    return [];
  }
};

export const fetchGameStats = async (gameId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/game/${gameId}/boxscore`);
    const { teams } = response.data;
    
    return {
      away: {
        team: teams.away.team.name,
        stats: teams.away.teamStats.teamSkaterStats,
        players: Object.values(teams.away.players)
          .filter(player => player.stats?.skaterStats || player.stats?.goalieStats)
          .map(player => ({
            name: player.person.fullName,
            position: player.position.code,
            stats: player.stats.skaterStats || player.stats.goalieStats
          }))
      },
      home: {
        team: teams.home.team.name,
        stats: teams.home.teamStats.teamSkaterStats,
        players: Object.values(teams.home.players)
          .filter(player => player.stats?.skaterStats || player.stats?.goalieStats)
          .map(player => ({
            name: player.person.fullName,
            position: player.position.code,
            stats: player.stats.skaterStats || player.stats.goalieStats
          }))
      }
    };
  } catch (error) {
    console.error('Error fetching game stats:', error);
    return null;
  }
};

export const fetchDailyLeaders = async () => {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    const response = await axios.get(
      `${API_BASE_URL}/schedule?expand=schedule.linescore,schedule.scoringplays&date=${today}`
    );
    
    const games = response.data.dates[0]?.games || [];
    const playerStats = new Map();

    // Collect stats from all games
    await Promise.all(games.map(async (game) => {
      const gameStats = await fetchGameStats(game.gamePk);
      if (!gameStats) return;

      [gameStats.home.players, gameStats.away.players].flat().forEach(player => {
        const existing = playerStats.get(player.name) || {
          name: player.name,
          position: player.position,
          goals: 0,
          assists: 0,
          points: 0,
          shots: 0
        };

        if (player.stats) {
          existing.goals = (existing.goals || 0) + (player.stats.goals || 0);
          existing.assists = (existing.assists || 0) + (player.stats.assists || 0);
          existing.points = (existing.points || 0) + (player.stats.goals || 0) + (player.stats.assists || 0);
          existing.shots = (existing.shots || 0) + (player.stats.shots || 0);
        }

        playerStats.set(player.name, existing);
      });
    }));

    // Convert to array and sort by points
    return Array.from(playerStats.values())
      .sort((a, b) => b.points - a.points || b.goals - a.goals)
      .slice(0, 10); // Top 10 players
  } catch (error) {
    console.error('Error fetching daily leaders:', error);
    return [];
  }
};
