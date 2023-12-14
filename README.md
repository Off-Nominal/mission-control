# Mission Control

Mission Control is a multi-purpose monolithic Node.JS application that provides services to the Off-Nominal Discord community.

## Database Migrations

This application maintains a database for various things and migrations are handled using the `db-migrate` package.

1. Create a new migration: `npx db-migrate create your_migration_name --sql-file` (the `--sql-file` flag will enable direct SQL migration authoring, which is preferred)
2. Migrate up: `npx db-migrate up -c 1` (migrate up 1 migration)
