import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  getClient, 
  fetchLeagueInfo, 
  fetchTeamsAtWeek, 
  fetchBoxscores, 
  fetchDraftInfo, 
  fetchFreeAgents 
} from '@/lib/espn/client';

// Mock the ESPN Fantasy Football API
vi.mock('espn-fantasy-football-api/node', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      setCookies: vi.fn(),
      getLeagueInfo: vi.fn(),
      getTeamsAtWeek: vi.fn(),
      getBoxscoreForWeek: vi.fn(),
      getDraftInfo: vi.fn(),
      getFreeAgents: vi.fn(),
    })),
  };
});

// Import fixtures
import leagueInfoFixture from '../fixtures/espn/league-info.json';
import teamsWeek4Fixture from '../fixtures/espn/teams-week4.json';
import boxscoresWeek4Fixture from '../fixtures/espn/boxscores-week4.json';
import draftInfoFixture from '../fixtures/espn/draft-info.json';
import freeAgentsFixture from '../fixtures/espn/free-agents.json';

describe('ESPN Client Wrapper', () => {
  let mockClient: any;

  beforeEach(async () => {
    const Client = vi.mocked(await import('espn-fantasy-football-api/node')).default;
    mockClient = {
      setCookies: vi.fn(),
      getLeagueInfo: vi.fn(),
      getTeamsAtWeek: vi.fn(),
      getBoxscoreForWeek: vi.fn(),
      getDraftInfo: vi.fn(),
      getFreeAgents: vi.fn(),
    };
    Client.mockImplementation(() => mockClient);
  });

  describe('getClient', () => {
    it('creates client without cookies', () => {
      const client = getClient(12345);
      expect(client).toBeDefined();
      expect(mockClient.setCookies).not.toHaveBeenCalled();
    });

    it('creates client with cookies', () => {
      const cookies = { espnS2: 'session123', SWID: 'swid456' };
      const client = getClient(12345, cookies);
      expect(client).toBeDefined();
      expect(mockClient.setCookies).toHaveBeenCalledWith(cookies);
    });
  });

  describe('fetchLeagueInfo', () => {
    it('maps league info fields correctly', async () => {
      mockClient.getLeagueInfo.mockResolvedValue(leagueInfoFixture);

      const result = await fetchLeagueInfo({
        leagueId: 12345,
        seasonId: 2025
      });

      expect(result).toEqual({
        id: 12345,
        seasonId: 2025,
        currentScoringPeriod: 4,
        settings: {
          name: 'Test Fantasy League',
          scoringSettings: {
            scoringItems: [
              { statId: 53, points: 1.0 },
              { statId: 42, points: 6.0 },
              { statId: 43, points: 4.0 },
              { statId: 44, points: -2.0 }
            ]
          },
          rosterSettings: {
            lineupSlotCounts: {
              '0': 1, '2': 2, '4': 2, '6': 1, '16': 1, '17': 1, '20': 1, '21': 6
            }
          },
          acquisitionSettings: {
            acquisitionBudget: 200
          }
        }
      });

      expect(mockClient.getLeagueInfo).toHaveBeenCalledWith({ seasonId: 2025 });
    });

    it('handles missing league data gracefully', async () => {
      mockClient.getLeagueInfo.mockResolvedValue({
        id: 12345,
        seasonId: 2025,
        settings: {}
      });

      const result = await fetchLeagueInfo({
        leagueId: 12345,
        seasonId: 2025
      });

      expect(result.settings.name).toBe('League 12345');
      expect(result.settings.acquisitionSettings.acquisitionBudget).toBe(200);
    });

    it('throws error on API failure', async () => {
      mockClient.getLeagueInfo.mockRejectedValue(new Error('API Error'));

      await expect(fetchLeagueInfo({
        leagueId: 12345,
        seasonId: 2025
      })).rejects.toThrow('Failed to fetch league info for league 12345');
    });
  });

  describe('fetchTeamsAtWeek', () => {
    it('maps teams data correctly', async () => {
      mockClient.getTeamsAtWeek.mockResolvedValue(teamsWeek4Fixture);

      const result = await fetchTeamsAtWeek({
        leagueId: 12345,
        seasonId: 2025,
        week: 4
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 1,
        name: 'Team Alpha',
        abbrev: 'ALPH',
        owners: [{ id: 'user123', displayName: 'John Doe' }],
        roster: {
          entries: expect.arrayContaining([
            expect.objectContaining({
              playerId: 4046533,
              lineupSlotId: 0,
              playerPoolEntry: {
                player: expect.objectContaining({
                  id: 4046533,
                  fullName: 'Josh Allen',
                  defaultPositionId: 1
                })
              }
            })
          ])
        }
      });

      expect(mockClient.getTeamsAtWeek).toHaveBeenCalledWith({
        seasonId: 2025,
        scoringPeriodId: 4
      });
    });

    it('handles missing team data gracefully', async () => {
      mockClient.getTeamsAtWeek.mockResolvedValue([{
        id: 1,
        roster: {}
      }]);

      const result = await fetchTeamsAtWeek({
        leagueId: 12345,
        seasonId: 2025,
        week: 4
      });

      expect(result[0].name).toBe('Team 1');
      expect(result[0].abbrev).toBe('T1');
      expect(result[0].owners).toEqual([]);
      expect(result[0].roster.entries).toEqual([]);
    });
  });

  describe('fetchBoxscores', () => {
    it('maps boxscore data correctly', async () => {
      mockClient.getBoxscoreForWeek.mockResolvedValue(boxscoresWeek4Fixture);

      const result = await fetchBoxscores({
        leagueId: 12345,
        seasonId: 2025,
        week: 4
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        matchupPeriodId: 4,
        teams: expect.arrayContaining([
          expect.objectContaining({
            teamId: 1,
            totalPoints: 134.7,
            roster: {
              entries: expect.arrayContaining([
                expect.objectContaining({
                  playerId: 4046533,
                  lineupSlotId: 0
                })
              ])
            }
          })
        ])
      });
    });
  });

  describe('fetchDraftInfo', () => {
    it('maps draft data correctly', async () => {
      mockClient.getDraftInfo.mockResolvedValue({ picks: draftInfoFixture });

      const result = await fetchDraftInfo({
        leagueId: 12345,
        seasonId: 2025
      });

      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({
        id: 4046533,
        fullName: 'Josh Allen',
        bidAmount: 65,
        nominatingTeamId: 1,
        overallDraftPosition: 1
      });
    });

    it('handles missing draft picks', async () => {
      mockClient.getDraftInfo.mockResolvedValue({});

      const result = await fetchDraftInfo({
        leagueId: 12345,
        seasonId: 2025
      });

      expect(result).toEqual([]);
    });
  });

  describe('fetchFreeAgents', () => {
    it('maps free agent data correctly', async () => {
      mockClient.getFreeAgents.mockResolvedValue(freeAgentsFixture);

      const result = await fetchFreeAgents({
        leagueId: 12345,
        seasonId: 2025,
        week: 4
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 4241479,
        player: expect.objectContaining({
          id: 4241479,
          fullName: 'Jaylen Warren',
          defaultPositionId: 2
        }),
        status: 'FREEAGENT'
      });
    });
  });

  describe('error handling', () => {
    it('wraps API errors with context', async () => {
      mockClient.getTeamsAtWeek.mockRejectedValue(new Error('Network timeout'));

      await expect(fetchTeamsAtWeek({
        leagueId: 12345,
        seasonId: 2025,
        week: 4
      })).rejects.toThrow('Failed to fetch teams at week 4 for league 12345: Error: Network timeout');
    });
  });
});