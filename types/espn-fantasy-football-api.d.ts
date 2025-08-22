declare module 'espn-fantasy-football-api/node' {
  interface ClientOptions {
    leagueId: number;
  }

  interface ClientCookies {
    espnS2: string;
    SWID: string;
  }

  interface GetLeagueInfoParams {
    seasonId: number;
  }

  interface GetTeamsAtWeekParams {
    seasonId: number;
    scoringPeriodId: number;
  }

  interface GetBoxscoreParams {
    seasonId: number;
    matchupPeriodId: number;
    scoringPeriodId: number;
  }

  interface GetDraftInfoParams {
    seasonId: number;
  }

  interface GetFreeAgentsParams {
    seasonId: number;
    scoringPeriodId: number;
  }

  class Client {
    constructor(options: ClientOptions);
    setCookies(cookies: ClientCookies): void;
    getLeagueInfo(params: GetLeagueInfoParams): Promise<any>;
    getTeamsAtWeek(params: GetTeamsAtWeekParams): Promise<any>;
    getBoxscoreForWeek(params: GetBoxscoreParams): Promise<any>;
    getDraftInfo(params: GetDraftInfoParams): Promise<any>;
    getFreeAgents(params: GetFreeAgentsParams): Promise<any>;
  }

  export default Client;
}