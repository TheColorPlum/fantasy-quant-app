import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create sample users
  const user1 = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      handle: 'demouser',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      handle: 'testuser',
    },
  });

  // Create a sample league
  const league = await prisma.league.upsert({
    where: { espnLeagueId: 'espn-test-123' },
    update: {},
    create: {
      espnLeagueId: 'espn-test-123',
      season: 2024,
      name: 'Test League',
      scoringJson: {
        passingYards: 0.04,
        passingTouchdowns: 4,
        interceptions: -1,
        rushingYards: 0.1,
        rushingTouchdowns: 6,
        receivingYards: 0.1,
        receivingTouchdowns: 6,
        receptions: 0.5,
      },
      rosterRulesJson: {
        QB: 1,
        RB: 2,
        WR: 2,
        TE: 1,
        FLEX: 1,
        DST: 1,
        K: 1,
        BENCH: 6,
      },
      auctionBudget: 200,
      createdBy: user1.id,
    },
  });

  // Create sample teams
  const team1 = await prisma.team.upsert({
    where: { 
      leagueId_espnTeamId: { 
        leagueId: league.id, 
        espnTeamId: 1 
      } 
    },
    update: {},
    create: {
      leagueId: league.id,
      espnTeamId: 1,
      name: 'Team Alpha',
      ownerUserId: user1.id,
    },
  });

  const team2 = await prisma.team.upsert({
    where: { 
      leagueId_espnTeamId: { 
        leagueId: league.id, 
        espnTeamId: 2 
      } 
    },
    update: {},
    create: {
      leagueId: league.id,
      espnTeamId: 2,
      name: 'Team Beta',
      ownerUserId: user2.id,
    },
  });

  // Create sample players
  const players = await Promise.all([
    prisma.player.upsert({
      where: { espnPlayerId: 4046 },
      update: {},
      create: {
        espnPlayerId: 4046,
        name: 'Josh Allen',
        posPrimary: 'QB',
        posEligibility: ['QB'],
        teamAbbr: 'BUF',
      },
    }),
    prisma.player.upsert({
      where: { espnPlayerId: 3043 },
      update: {},
      create: {
        espnPlayerId: 3043,
        name: 'Christian McCaffrey',
        posPrimary: 'RB',
        posEligibility: ['RB'],
        teamAbbr: 'SF',
      },
    }),
    prisma.player.upsert({
      where: { espnPlayerId: 2976 },
      update: {},
      create: {
        espnPlayerId: 2976,
        name: 'Tyreek Hill',
        posPrimary: 'WR',
        posEligibility: ['WR'],
        teamAbbr: 'MIA',
      },
    }),
  ]);

  console.log('✅ Seed completed successfully');
  console.log('Created:');
  console.log(`  - ${2} users`);
  console.log(`  - ${1} league`);
  console.log(`  - ${2} teams`);
  console.log(`  - ${players.length} players`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });