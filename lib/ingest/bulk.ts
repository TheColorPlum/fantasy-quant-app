import { db } from '@/lib/database';
import { 
  fetchLeagueInfo, 
  fetchTeamsAtWeek, 
  fetchBoxscores, 
  fetchDraftInfo, 
  fetchFreeAgents,
  type EspnCookies 
} from '@/lib/espn/client';
import { ESPN_POSITION_MAP, ESPN_TEAM_MAP } from '@/lib/espn/types';

export interface BulkIngestArgs {
  leagueId: number;
  seasonId: number;
  cookies?: EspnCookies;
}

export interface BulkIngestResult {
  success: boolean;
  leagueDbId: string;
  teamsCreated: number;
  playersCreated: number;
  auctionPricesCreated: number;
  gameLogsCreated: number;
  error?: string;
}

/**
 * Performs bulk ingestion of league data from ESPN
 * Uses advisory lock to prevent concurrent ingestion of the same league
 */
export async function performBulkIngest(args: BulkIngestArgs): Promise<BulkIngestResult> {
  const lockId = args.leagueId;
  const lockSubId = args.seasonId;
  
  try {
    // Acquire advisory lock (PostgreSQL-specific)
    await db.$executeRawUnsafe(
      'SELECT pg_advisory_xact_lock($1, $2)', 
      lockId, 
      lockSubId
    );
    
    console.log(`Starting bulk ingest for league ${args.leagueId}, season ${args.seasonId}`);
    
    // Step 1: Fetch and create league
    const espnLeague = await fetchLeagueInfo(args);
    const league = await db.league.upsert({
      where: { espnLeagueId: args.leagueId.toString() },
      update: {
        name: espnLeague.settings.name,
        scoringJson: espnLeague.settings.scoringSettings,
        rosterRulesJson: espnLeague.settings.rosterSettings,
        auctionBudget: espnLeague.settings.acquisitionSettings.acquisitionBudget,
        firstLoadedAt: new Date()
      },
      create: {
        espnLeagueId: args.leagueId.toString(),
        season: args.seasonId,
        name: espnLeague.settings.name,
        scoringJson: espnLeague.settings.scoringSettings,
        rosterRulesJson: espnLeague.settings.rosterSettings,
        auctionBudget: espnLeague.settings.acquisitionSettings.acquisitionBudget,
        firstLoadedAt: new Date()
      }
    });
    
    // Step 2: Fetch teams and rosters for current week
    const currentWeek = espnLeague.currentScoringPeriod;
    const espnTeams = await fetchTeamsAtWeek({
      leagueId: args.leagueId,
      seasonId: args.seasonId,
      week: currentWeek,
      cookies: args.cookies
    });
    
    let teamsCreated = 0;
    let playersCreated = 0;
    
    for (const espnTeam of espnTeams) {
      // Create/update team
      const team = await db.team.upsert({
        where: {
          leagueId_espnTeamId: {
            leagueId: league.id,
            espnTeamId: espnTeam.id
          }
        },
        update: {
          name: espnTeam.name,
          ownerUserId: espnTeam.owners[0]?.id || null
        },
        create: {
          leagueId: league.id,
          espnTeamId: espnTeam.id,
          name: espnTeam.name,
          ownerUserId: espnTeam.owners[0]?.id || null
        }
      });
      teamsCreated++;
      
      // Process roster entries
      for (const entry of espnTeam.roster.entries) {
        const espnPlayer = entry.playerPoolEntry.player;
        
        // Create/update player
        const player = await db.player.upsert({
          where: { espnPlayerId: espnPlayer.id },
          update: {
            name: espnPlayer.fullName,
            posPrimary: ESPN_POSITION_MAP[espnPlayer.defaultPositionId] || 'UNKNOWN',
            posEligibility: espnPlayer.eligibleSlots.map(slot => ESPN_POSITION_MAP[slot]).filter(Boolean),
            teamAbbr: ESPN_TEAM_MAP[espnPlayer.proTeamId] || null
          },
          create: {
            espnPlayerId: espnPlayer.id,
            name: espnPlayer.fullName,
            posPrimary: ESPN_POSITION_MAP[espnPlayer.defaultPositionId] || 'UNKNOWN',
            posEligibility: espnPlayer.eligibleSlots.map(slot => ESPN_POSITION_MAP[slot]).filter(Boolean),
            teamAbbr: ESPN_TEAM_MAP[espnPlayer.proTeamId] || null
          }
        });
        playersCreated++;
        
        // Create roster slot
        await db.rosterSlot.create({
          data: {
            teamId: team.id,
            playerId: player.id,
            slotType: ESPN_POSITION_MAP[entry.lineupSlotId] || 'UNKNOWN',
            week: currentWeek
          }
        });
      }
    }
    
    // Step 3: Fetch draft/auction data
    let auctionPricesCreated = 0;
    try {
      const draftPlayers = await fetchDraftInfo(args);
      for (const draftPlayer of draftPlayers) {
        if (draftPlayer.bidAmount && draftPlayer.bidAmount > 0) {
          // Find the player in our database
          const player = await db.player.findUnique({
            where: { espnPlayerId: draftPlayer.id }
          });
          
          if (player) {
            await db.auctionPrice.create({
              data: {
                leagueId: league.id,
                playerId: player.id,
                amount: draftPlayer.bidAmount,
                source: 'ESPN_DRAFT'
              }
            });
            auctionPricesCreated++;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to fetch draft info, continuing without auction prices:', error);
    }
    
    // Step 4: Fetch recent boxscores (last 3 weeks)
    let gameLogsCreated = 0;
    const weeksToFetch = Math.min(3, currentWeek);
    
    for (let week = Math.max(1, currentWeek - weeksToFetch + 1); week <= currentWeek; week++) {
      try {
        const boxscores = await fetchBoxscores({
          leagueId: args.leagueId,
          seasonId: args.seasonId,
          week,
          cookies: args.cookies
        });
        
        for (const boxscore of boxscores) {
          for (const team of boxscore.teams) {
            for (const entry of team.roster.entries) {
              const espnPlayer = entry.playerPoolEntry.player;
              
              // Find player in our database
              const player = await db.player.findUnique({
                where: { espnPlayerId: espnPlayer.id }
              });
              
              if (player && espnPlayer.stats && espnPlayer.stats.length > 0) {
                const weekStats = espnPlayer.stats.find(s => 
                  s.statSplitTypeId === 1 && // Weekly stats
                  s.statSourceId === 1 // Actual stats
                );
                
                if (weekStats) {
                  // Calculate fantasy points (simplified)
                  const stats = weekStats.stats;
                  const ptsActual = (stats['53'] || 0) * 0.04 + // Passing yards
                                   (stats['42'] || 0) * 6 +    // Passing TDs
                                   (stats['44'] || 0) * -2 +   // Interceptions
                                   (stats['24'] || 0) * 0.1 +  // Rushing yards
                                   (stats['25'] || 0) * 6;     // Rushing TDs
                  
                  await db.gameLog.upsert({
                    where: {
                      playerId_week: {
                        playerId: player.id,
                        week
                      }
                    },
                    update: {
                      statsJson: stats,
                      ptsActual
                    },
                    create: {
                      playerId: player.id,
                      week,
                      statsJson: stats,
                      ptsActual
                    }
                  });
                  gameLogsCreated++;
                }
              }
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch boxscores for week ${week}, continuing:`, error);
      }
    }
    
    // Step 5: Compute replacement baselines (simplified)
    const positions = ['QB', 'RB', 'WR', 'TE', 'K', 'D/ST'];
    for (const pos of positions) {
      const baselineRank = getBaselineRank(pos);
      const avgPoints = await calculatePositionAverage(pos, args.seasonId);
      
      await db.replacementBaseline.upsert({
        where: {
          season_pos: {
            season: args.seasonId,
            pos
          }
        },
        update: {
          baselineRank,
          ptsPerGame: avgPoints,
          source: 'BULK_INGEST'
        },
        create: {
          season: args.seasonId,
          pos,
          baselineRank,
          ptsPerGame: avgPoints,
          source: 'BULK_INGEST'
        }
      });
    }
    
    console.log(`Bulk ingest completed for league ${args.leagueId}: ${teamsCreated} teams, ${playersCreated} players, ${auctionPricesCreated} auction prices, ${gameLogsCreated} game logs`);
    
    return {
      success: true,
      leagueDbId: league.id,
      teamsCreated,
      playersCreated,
      auctionPricesCreated,
      gameLogsCreated
    };
    
  } catch (error) {
    console.error('Bulk ingest failed:', error);
    return {
      success: false,
      leagueDbId: '',
      teamsCreated: 0,
      playersCreated: 0,
      auctionPricesCreated: 0,
      gameLogsCreated: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get baseline rank for replacement-level calculations
 */
function getBaselineRank(position: string): number {
  const baselines: Record<string, number> = {
    'QB': 12,   // QB12
    'RB': 24,   // RB24
    'WR': 36,   // WR36
    'TE': 12,   // TE12
    'K': 12,    // K12
    'D/ST': 12  // DST12
  };
  return baselines[position] || 12;
}

/**
 * Calculate average points for a position (simplified)
 */
async function calculatePositionAverage(position: string, season: number): Promise<number> {
  // This is a simplified calculation
  // In a real implementation, this would analyze actual game logs
  const averages: Record<string, number> = {
    'QB': 18.5,
    'RB': 12.8,
    'WR': 11.2,
    'TE': 8.9,
    'K': 7.5,
    'D/ST': 9.1
  };
  return averages[position] || 10.0;
}