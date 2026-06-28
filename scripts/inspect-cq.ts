import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

async function main() {
  // Find CQs with images
  const cqs = await db.cQ.findMany({
    where: {
      OR: [
        { uddeepokImage: { not: null } },
        { question1Image: { not: null } },
        { answer1Image: { not: null } },
      ]
    },
    take: 5,
    select: {
      id: true,
      uddeepokImage: true,
      question1Image: true,
      question2Image: true,
      question3Image: true,
      question4Image: true,
      answer1Image: true,
      answer2Image: true,
      answer3Image: true,
      answer4Image: true,
    }
  })

  console.log('=== CQ Records with Images ===')
  for (const cq of cqs) {
    console.log(`\nCQ ID: ${cq.id}`)
    const fields: Record<string, string | null> = {}
    for (const [key, value] of Object.entries(cq)) {
      if (value) {
        fields[key] = value as string
      }
    }
    console.log(JSON.stringify(fields, null, 2))
  }

  await db.$disconnect()
}

main().catch(console.error)
