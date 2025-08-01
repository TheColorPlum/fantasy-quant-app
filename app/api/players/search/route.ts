import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const searchPlayersSchema = z.object({
  query: z.string().optional(),
  position: z.enum(["ALL", "QB", "RB", "WR", "TE", "K", "DST"]).optional(),
  ownership: z.enum(["ALL", "OWNED", "AVAILABLE"]).optional(),
  sortBy: z.enum(["name", "value", "trend", "projectedPoints"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = {
      query: searchParams.get("query") || undefined,
      position: searchParams.get("position") || "ALL",
      ownership: searchParams.get("ownership") || "ALL",
      sortBy: searchParams.get("sortBy") || "value",
      sortOrder: searchParams.get("sortOrder") || "desc",
      page: Number.parseInt(searchParams.get("page") || "1"),
      limit: Number.parseInt(searchParams.get("limit") || "20"),
    }

    const validatedParams = searchPlayersSchema.parse(params)

    // Mock comprehensive player database
    const mockPlayers = [
      {
        id: "1",
        name: "Josh Allen",
        position: "QB",
        team: "BUF",
        nflTeam: "Buffalo Bills",
        value: 45.2,
        trend: 2.1,
        projectedPoints: 24.8,
        ownership: "OWNED",
        fantasyTeam: "Team Thunder",
        injuryStatus: "HEALTHY",
        byeWeek: 12,
        stats: {
          passingYards: 3891,
          passingTDs: 29,
          rushingYards: 523,
          rushingTDs: 15,
        },
      },
      {
        id: "2",
        name: "Christian McCaffrey",
        position: "RB",
        team: "SF",
        nflTeam: "San Francisco 49ers",
        value: 52.8,
        trend: -1.3,
        projectedPoints: 22.4,
        ownership: "OWNED",
        fantasyTeam: "Gridiron Gladiators",
        injuryStatus: "HEALTHY",
        byeWeek: 9,
        stats: {
          rushingYards: 1459,
          rushingTDs: 14,
          receivingYards: 564,
          receivingTDs: 7,
        },
      },
      {
        id: "3",
        name: "Tyreek Hill",
        position: "WR",
        team: "MIA",
        nflTeam: "Miami Dolphins",
        value: 41.7,
        trend: 3.4,
        projectedPoints: 19.6,
        ownership: "OWNED",
        fantasyTeam: "Fantasy Phenoms",
        injuryStatus: "HEALTHY",
        byeWeek: 6,
        stats: {
          receivingYards: 1481,
          receivingTDs: 13,
          receptions: 119,
          targets: 171,
        },
      },
      {
        id: "4",
        name: "Travis Kelce",
        position: "TE",
        team: "KC",
        nflTeam: "Kansas City Chiefs",
        value: 38.9,
        trend: -0.8,
        projectedPoints: 16.2,
        ownership: "OWNED",
        fantasyTeam: "Touchdown Titans",
        injuryStatus: "HEALTHY",
        byeWeek: 10,
        stats: {
          receivingYards: 984,
          receivingTDs: 5,
          receptions: 93,
          targets: 121,
        },
      },
      {
        id: "5",
        name: "Lamar Jackson",
        position: "QB",
        team: "BAL",
        nflTeam: "Baltimore Ravens",
        value: 43.1,
        trend: 4.2,
        projectedPoints: 23.9,
        ownership: "AVAILABLE",
        fantasyTeam: null,
        injuryStatus: "HEALTHY",
        byeWeek: 14,
        stats: {
          passingYards: 3678,
          passingTDs: 24,
          rushingYards: 821,
          rushingTDs: 5,
        },
      },
      {
        id: "6",
        name: "Derrick Henry",
        position: "RB",
        team: "BAL",
        nflTeam: "Baltimore Ravens",
        value: 35.4,
        trend: 1.8,
        projectedPoints: 18.7,
        ownership: "AVAILABLE",
        fantasyTeam: null,
        injuryStatus: "HEALTHY",
        byeWeek: 14,
        stats: {
          rushingYards: 1325,
          rushingTDs: 13,
          receivingYards: 169,
          receivingTDs: 1,
        },
      },
      {
        id: "7",
        name: "CeeDee Lamb",
        position: "WR",
        team: "DAL",
        nflTeam: "Dallas Cowboys",
        value: 40.2,
        trend: -2.1,
        projectedPoints: 18.9,
        ownership: "OWNED",
        fantasyTeam: "Team Thunder",
        injuryStatus: "QUESTIONABLE",
        byeWeek: 7,
        stats: {
          receivingYards: 1749,
          receivingTDs: 12,
          receptions: 135,
          targets: 181,
        },
      },
      {
        id: "8",
        name: "George Kittle",
        position: "TE",
        team: "SF",
        nflTeam: "San Francisco 49ers",
        value: 28.6,
        trend: 0.5,
        projectedPoints: 14.3,
        ownership: "AVAILABLE",
        fantasyTeam: null,
        injuryStatus: "HEALTHY",
        byeWeek: 9,
        stats: {
          receivingYards: 1020,
          receivingTDs: 8,
          receptions: 65,
          targets: 91,
        },
      },
    ]

    // Apply filters
    let filteredPlayers = mockPlayers

    // Search by name
    if (validatedParams.query) {
      filteredPlayers = filteredPlayers.filter(
        (player) =>
          player.name.toLowerCase().includes(validatedParams.query!.toLowerCase()) ||
          player.team.toLowerCase().includes(validatedParams.query!.toLowerCase()) ||
          player.nflTeam.toLowerCase().includes(validatedParams.query!.toLowerCase()),
      )
    }

    // Filter by position
    if (validatedParams.position && validatedParams.position !== "ALL") {
      filteredPlayers = filteredPlayers.filter((player) => player.position === validatedParams.position)
    }

    // Filter by ownership
    if (validatedParams.ownership && validatedParams.ownership !== "ALL") {
      filteredPlayers = filteredPlayers.filter((player) => player.ownership === validatedParams.ownership)
    }

    // Sort players
    const sortBy = validatedParams.sortBy || "value"
    const sortOrder = validatedParams.sortOrder || "desc"

    filteredPlayers.sort((a, b) => {
      let aValue: any = a[sortBy as keyof typeof a]
      let bValue: any = b[sortBy as keyof typeof b]

      if (sortBy === "name") {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    // Pagination
    const page = validatedParams.page || 1
    const limit = validatedParams.limit || 20
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedPlayers = filteredPlayers.slice(startIndex, endIndex)

    return NextResponse.json({
      success: true,
      players: paginatedPlayers,
      pagination: {
        page,
        limit,
        total: filteredPlayers.length,
        totalPages: Math.ceil(filteredPlayers.length / limit),
        hasNext: endIndex < filteredPlayers.length,
        hasPrev: page > 1,
      },
      filters: {
        query: validatedParams.query,
        position: validatedParams.position,
        ownership: validatedParams.ownership,
        sortBy: validatedParams.sortBy,
        sortOrder: validatedParams.sortOrder,
      },
    })
  } catch (error) {
    console.error("Player search error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid search parameters", details: error.errors },
        { status: 400 },
      )
    }

    return NextResponse.json({ success: false, error: "Failed to search players" }, { status: 500 })
  }
}
