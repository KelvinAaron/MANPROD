import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = 'admin@manprod.com'
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (existing) {
    console.log('Admin already exists:', adminEmail)
    return
  }

  const passwordHash = await bcrypt.hash('admin1234', 12)
  const admin = await prisma.user.create({
    data: {
      name: 'MANPROD Admin',
      email: adminEmail,
      passwordHash,
      role: 'ADMIN',
      admin: { create: {} },
    },
  })
  console.log('Admin created:', admin.email)
  console.log('Password: admin1234  (change this in production!)')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
