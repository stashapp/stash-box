# Entity Services Layer

This services layer provides a clean abstraction between the GraphQL API layer and the database layer, using the new `internal/db` sqlc-generated queries. Each entity has its own package with a dedicated service.

## Architecture

```
pkg/api (GraphQL resolvers) 
    ↓ 
internal/service/* (Business logic layer - one package per entity)
    ↓
internal/db (sqlc-generated database access)
    ↓
PostgreSQL Database
```

## Service Packages

### Entity Services
- **`internal/service/user`** - User management, authentication, roles
- **`internal/service/tag`** - Tag CRUD, aliases, merging
- **`internal/service/performer`** - Performer data, physical attributes, associations
- **`internal/service/scene`** - Scene management, fingerprints, associations
- **`internal/service/studio`** - Studio hierarchy, aliases, URLs
- **`internal/service/edit`** - Edit workflow, comments, voting

## Service Construction

Each service follows the same constructor pattern:

```go
// Service constructor accepts Queries and Context
func NewService(queries *db.Queries, ctx context.Context) *Service

// Service struct holds both
type Service struct {
    queries *db.Queries
    ctx     context.Context
}
```

## Usage Examples

### Basic Usage
```go
// Create queries instance from database connection
queries := db.New(dbConnection)

// Initialize service with context
userSvc := user.NewService(queries, ctx)

// Use service methods
user, err := userSvc.FindByID(userID)
newUser, err := userSvc.Create(createInput)
```

### In GraphQL Resolvers
```go
func (r *mutationResolver) UserCreate(ctx context.Context, input models.UserCreateInput) (*models.User, error) {
    queries := db.New(r.dbConnection)
    userSvc := user.NewService(queries, ctx)
    return userSvc.Create(input)
}
```

### Transaction Context
```go
// Services use the context provided at construction time
// For transactions, create services within transaction scope
tx, err := db.BeginTx(ctx, nil)
if err != nil {
    return err
}
defer tx.Rollback()

queries := db.New(tx)
userSvc := user.NewService(queries, ctx)
// ... perform operations
tx.Commit()
```

## Service Methods

Each service provides standard methods:

### Queries
- **`FindByID(id uuid.UUID)`** - Find entity by primary key
- **`FindByName(name string)`** - Find by name/title (where applicable)
- **`FindByAlias(alias string)`** - Find by alias (where applicable)  
- **`Query(input models.XQueryInput)`** - Complex search with filters/pagination
- **`Count()`** - Get total count

### Mutations
- **`Create(input models.XCreateInput)`** - Create new entity
- **`Update(input models.XUpdateInput)`** - Update existing entity
- **`Delete(id uuid.UUID)`** - Hard delete entity
- **`SoftDelete(id uuid.UUID)`** - Mark as deleted
- **`Merge(input models.XMergeInput)`** - Merge multiple entities

### Associations
- **`GetAliases(id uuid.UUID)`** - Get entity aliases
- **`CreateAliases(id uuid.UUID, aliases []string)`** - Create aliases
- **Entity-specific associations** (URLs, tattoos, piercings, etc.)

## Features

### ✅ Implemented
- **Type-safe database access** using sqlc-generated queries
- **One package per entity** for clear separation of concerns
- **Context-aware operations** with provided context
- **Comprehensive CRUD operations** for all major entities
- **Association management** (aliases, URLs, relationships)
- **Soft delete support** with proper cascade handling
- **Authentication/Authorization** for users and roles
- **Complex operations** like entity merging and edit workflows
- **Fingerprint matching** with all three algorithms (MD5, OSHASH, PHASH)
- **Edit system** with comments, voting, and approval workflow

### ⚠️ Requires Extension
- **Complex querying** - Dynamic filtering, sorting, pagination require additional implementation
- **Search functionality** - Full-text search, fuzzy matching needs custom queries
- **Transaction management** - Cross-service transactions
- **Performance optimization** - Caching, bulk operations
- **Event system** - Notifications, webhooks, audit logging

## Integration Notes

### Database Layer Integration
- Uses `*db.Queries` (sqlc-generated) for type-safe database operations
- Context is used for all database operations
- Handles UUID conversion between `uuid.UUID` and `pgtype.UUID`
- Properly manages nullable database fields
- Supports both full and partial entity updates

### API Layer Integration
- Services can be used directly in GraphQL resolvers
- Replace existing `fac.WithTxn()` patterns with service calls
- Maintains existing validation logic from `pkg/user`, `pkg/scene`, etc.
- Compatible with existing authentication/authorization patterns

### Migration Strategy
1. **Start with simple operations** - Replace basic CRUD operations first
2. **One service at a time** - Migrate entity by entity
3. **Incremental adoption** - Use services for new features, migrate existing gradually
4. **Transaction boundaries** - Create services within transaction scope when needed

## Error Handling

Services return standard Go errors with context:
- **NotFound errors** for missing entities
- **Validation errors** for invalid input
- **Database errors** wrapped with additional context
- **Business logic errors** for rule violations

## Testing

Services are designed to be easily testable:
- Each service is isolated in its own package
- Constructor injection makes mocking straightforward
- Context can be used for testing timeouts/cancellation
- No direct database dependencies in business logic
- Clear separation of concerns
- Stateless operations (state is in context and queries)

## Example Service Structure

```
internal/service/user/
├── service.go          # Main service implementation
└── service_test.go     # Service tests (when added)

internal/service/tag/
├── service.go          # Main service implementation  
└── service_test.go     # Service tests (when added)

... (other entity packages)
```

This architecture provides clean separation, easy testing, and clear dependency injection while maintaining the type safety benefits of sqlc-generated queries.