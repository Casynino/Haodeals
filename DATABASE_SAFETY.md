# ⚠️ DATABASE SAFETY RULES — READ BEFORE ANY DB COMMAND

## ✅ SAFE commands (use these)
```bash
npm run db:push        # Add new tables/columns — NEVER deletes data
npm run db:studio      # Browse the database visually
npm run db:seed        # Seed initial data
```

## 🚨 NEVER RUN THESE — they WIPE ALL DATA
```bash
# ❌ FORBIDDEN — deletes every table and all data
prisma db push --force-reset
prisma migrate reset
prisma migrate reset --force
```

## 🔄 How to safely add new database tables/models
1. Edit `prisma/schema.prisma` to add the new model
2. Run: `npm run db:push`
3. That's it — existing data is preserved

## 💾 Backup reminder
- Go to Neon → Backup & Restore → Create snapshot BEFORE any schema changes
- The production branch should always be protected in Neon dashboard
