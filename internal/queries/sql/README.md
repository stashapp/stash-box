# SQLC Query Files

This directory contains SQL query files for use with [sqlc](https://sqlc.dev/) to generate type-safe Go database access code.

## Current Status

Successfully created comprehensive SQL query files that match the actual database schema from the migration files:

### Entity Files Created:
- **`user.sql`** - User CRUD operations, roles, API key lookups
- **`tag.sql`** - Tag management, aliases, redirects, scene associations
- **`performer.sql`** - Performer data, aliases, URLs, tattoos, piercings, redirects
- **`scene.sql`** - Scene data, URLs, performer associations, tag associations, redirects  
- **`studio.sql`** - Studio management with hierarchy support, aliases, URLs, redirects
- **`edit.sql`** - Edit workflow operations, comments, votes, status management
- **`fingerprint.sql`** - Normalized fingerprint operations (MD5, OSHASH, PHASH) with distance matching

### Generated Files:
- `internal/db/models.go` - Generated struct types matching database schema
- `internal/db/querier.go` - Query interface with all available operations  
- `internal/db/*.sql.go` - Implementation files for each query set
- `internal/db/db.go` - Database connection wrapper

## Schema Accuracy

All SQL files now correctly match the current database schema including:
- Proper column names (`password_hash` not `password`, `deathdate` not `death_date`)
- Normalized fingerprint schema (separate `fingerprints` table)
- Correct table relationships and foreign keys
- Reserved word handling (quoted `"as"` column in `scene_performers`)
- Boolean `deleted` columns (not timestamp `deleted_at`)

## Query Coverage

### Simple Operations (Fully Implemented):
✅ **CRUD operations** - Create, Read, Update, Delete for all entities
✅ **Lookups by name/alias** - Find entities by various identifiers
✅ **Association management** - Create/delete relationships between entities
✅ **Soft deletes** - Mark entities as deleted without removing them
✅ **Fingerprint matching** - All three algorithms with distance support
✅ **Role-based operations** - User role management
✅ **Edit workflow** - Basic edit, comment, and vote operations

### Complex Operations (Require Dynamic SQL):
⚠️ **Advanced search** - Multi-field text search with fuzzy matching
⚠️ **Complex filtering** - Dynamic WHERE clauses based on user input
⚠️ **Pagination & sorting** - Dynamic ORDER BY and LIMIT/OFFSET
⚠️ **Statistics & aggregation** - Usage counts, activity metrics
⚠️ **Hierarchical queries** - Studio parent-child traversal
⚠️ **Performance optimization** - Query optimization for large datasets

## Migration Strategy

### Recommended Approach:
1. **Start with simple operations** - Use sqlc for basic CRUD that maps well to static SQL
2. **Keep complex queries in existing builders** - Dynamic query construction should remain in `pkg/sqlx`
3. **Hybrid approach** - Gradually move simple operations to sqlc while preserving complex functionality
4. **Incremental adoption** - Use sqlc for new features where static SQL is sufficient

### Benefits of Current Implementation:
- **Type safety** - Compile-time verification of SQL correctness
- **Performance** - No reflection overhead, direct SQL execution
- **Maintainability** - Clear separation of concerns
- **PostgreSQL optimization** - Native pgx/v5 integration

## Usage

```bash
# Generate Go code from SQL files
sqlc generate
```

This will regenerate all the type-safe Go database access code based on the SQL queries defined in this directory.

## Integration Notes

The generated code can be used alongside the existing `pkg/sqlx` query builders:
- Use sqlc for simple, predictable operations
- Use query builders for complex, dynamic operations  
- Both can coexist in the same application