/**
 * Aggregate Analytics — Cron Script
 *
 * Pre-computes daily analytics snapshots to reduce query load on production.
 * Designed to be run daily via cron / Task Scheduler.
 *
 * Usage:
 *   npx tsx scripts/aggregate-analytics.ts --date 2026-06-22
 *   npx tsx scripts/aggregate-analytics.ts              # defaults to yesterday
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

function parseArgs(): { targetDate: Date } {
  const dateArg = process.argv.find((a) => a.startsWith('--date='))
  if (dateArg) {
    return { targetDate: new Date(dateArg.split('=')[1]) }
  }
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return { targetDate: d }
}

function dateRange(target: Date) {
  const from = new Date(target.getFullYear(), target.getMonth(), target.getDate(), 0, 0, 0)
  const to = new Date(target.getFullYear(), target.getMonth(), target.getDate(), 23, 59, 59, 999)
  return { from, to }
}

async function aggregateRevenue(from: Date, to: Date) {
  const agg = await db.payment.aggregate({
    where: { status: 'approved', createdAt: { gte: from, lte: to } },
    _sum: { amount: true },
    _count: true,
  })
  const byMethod = await db.payment.groupBy({
    by: ['method'],
    where: { status: 'approved', createdAt: { gte: from, lte: to } },
    _sum: { amount: true },
    _count: true,
  })
  return {
    totalRevenue: agg._sum.amount || 0,
    transactionCount: agg._count,
    byMethod: byMethod.map((m) => ({ method: m.method, revenue: m._sum.amount || 0, count: m._count })),
  }
}

async function aggregateUsers(from: Date, to: Date) {
  const newUsers = await db.user.count({ where: { role: 'STUDENT', createdAt: { gte: from, lte: to } } })
  const dau = await db.analyticsEvent.groupBy({
    by: ['userId'],
    where: { createdAt: { gte: from, lte: to }, userId: { not: null } },
  }).then((r) => r.length)
  return { newUsers, dau }
}

async function aggregateEnrollments(from: Date, to: Date) {
  const enrollments = await db.courseEnrollment.count({ where: { enrolledAt: { gte: from, lte: to } } })
  const completions = await db.courseEnrollment.count({ where: { completedAt: { not: null, gte: from, lte: to } } })
  return { enrollments, completions }
}

async function main() {
  const { targetDate } = parseArgs()
  const { from, to } = dateRange(targetDate)
  const dateStr = targetDate.toISOString().split('T')[0]

  console.log(`[Aggregate] Computing snapshots for ${dateStr}...`)

  const errors: string[] = []

  try {
    const revenue = await aggregateRevenue(from, to)
    console.log(`  ✓ Revenue: ৳${revenue.totalRevenue} (${revenue.transactionCount} txns)`)
    await db.analyticsReport.create({
      data: {
        name: `Daily Revenue Snapshot — ${dateStr}`,
        type: 'revenue',
        format: 'csv',
        config: { period: dateStr, data: JSON.stringify(revenue) },
        lastGenerated: new Date(),
      },
    })
  } catch (e) {
    errors.push(`revenue: ${e}`)
  }

  try {
    const users = await aggregateUsers(from, to)
    console.log(`  ✓ Users: ${users.newUsers} new, ${users.dau} DAU`)
    await db.analyticsReport.create({
      data: {
        name: `Daily Users Snapshot — ${dateStr}`,
        type: 'students',
        format: 'csv',
        config: { period: dateStr, data: JSON.stringify(users) },
        lastGenerated: new Date(),
      },
    })
  } catch (e) {
    errors.push(`users: ${e}`)
  }

  try {
    const enrollments = await aggregateEnrollments(from, to)
    console.log(`  ✓ Enrollments: ${enrollments.enrollments} new, ${enrollments.completions} completed`)
    await db.analyticsReport.create({
      data: {
        name: `Daily Enrollments Snapshot — ${dateStr}`,
        type: 'courses',
        format: 'csv',
        config: { period: dateStr, data: JSON.stringify(enrollments) },
        lastGenerated: new Date(),
      },
    })
  } catch (e) {
    errors.push(`enrollments: ${e}`)
  }

  if (errors.length > 0) {
    console.error(`\n✗ Errors (${errors.length}):`)
    errors.forEach((e) => console.error(`  - ${e}`))
    process.exit(1)
  }

  console.log(`\n✓ All snapshots computed successfully for ${dateStr}`)
  await db.$disconnect()
}

main().catch((e) => {
  console.error('Fatal:', e)
  process.exit(1)
})
