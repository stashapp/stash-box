// Package service provides a centralized service factory for database operations.
//
// Usage:
//
//	// Initialize the factory with a database pool
//	pool, err := pgxpool.New(context.Background(), databaseURL)
//	if err != nil {
//		log.Fatal(err)
//	}
//	factory := service.NewFactory(pool)
//
//	// Each service call creates a fresh querier instance
//	tagService := factory.Tag()
//	tag, err := tagService.FindByID(ctx, tagID)
//
//	userService := factory.User()
//	user, err := userService.FindByID(ctx, userID)
package service

import (
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stashapp/stash-box/internal/queries"
	"github.com/stashapp/stash-box/internal/email"
	"github.com/stashapp/stash-box/internal/service/draft"
	"github.com/stashapp/stash-box/internal/service/edit"
	"github.com/stashapp/stash-box/internal/service/image"
	"github.com/stashapp/stash-box/internal/service/invite"
	"github.com/stashapp/stash-box/internal/service/notification"
	"github.com/stashapp/stash-box/internal/service/performer"
	"github.com/stashapp/stash-box/internal/service/scene"
	"github.com/stashapp/stash-box/internal/service/site"
	"github.com/stashapp/stash-box/internal/service/studio"
	"github.com/stashapp/stash-box/internal/service/tag"
	"github.com/stashapp/stash-box/internal/service/user"
	"github.com/stashapp/stash-box/internal/service/usertoken"
)

// Factory provides access to all services with centralized database connection management
type Factory struct {
	db       *pgxpool.Pool
	withTxn  queries.WithTxnFunc
	emailMgr *email.Manager
}

// NewFactory creates a new service factory with the given database pool and email manager
func NewFactory(pool *pgxpool.Pool, emailMgr *email.Manager) *Factory {
	return &Factory{
		db:       pool,
		withTxn:  createWithTxnFunc(pool),
		emailMgr: emailMgr,
	}
}

// Tag returns a TagService instance
func (f *Factory) Tag() *tag.Tag {
	return tag.NewTag(queries.New(f.db), f.withTxn)
}

// Performer returns a PerformerService instance
func (f *Factory) Performer() *performer.Performer {
	return performer.NewPerformer(queries.New(f.db), f.withTxn)
}

// Scene returns a SceneService instance
func (f *Factory) Scene() *scene.Scene {
	return scene.NewScene(queries.New(f.db), f.withTxn)
}

// Studio returns a StudioService instance
func (f *Factory) Studio() *studio.Studio {
	return studio.NewStudio(queries.New(f.db), f.withTxn)
}

// User returns a UserService instance
func (f *Factory) User() *user.User {
	return user.NewUser(queries.New(f.db), f.withTxn, f.emailMgr)
}

// UserToken returns a UserTokenService instance
func (f *Factory) UserToken() *usertoken.UserToken {
	return usertoken.NewUserToken(queries.New(f.db), f.withTxn)
}

// Site returns a SiteService instance
func (f *Factory) Site() *site.Site {
	return site.NewSite(queries.New(f.db), f.withTxn)
}

// Edit returns an EditService instance
func (f *Factory) Edit() *edit.Edit {
	return edit.NewEdit(queries.New(f.db), f.withTxn)
}

// Image returns an ImageService instance
func (f *Factory) Image() *image.Image {
	return image.NewImage(queries.New(f.db), f.withTxn)
}

// Draft returns a DraftService instance
func (f *Factory) Draft() *draft.Draft {
	return draft.NewDraft(queries.New(f.db), f.withTxn)
}

// Notification returns a NotificationService instance
func (f *Factory) Notification() *notification.Notification {
	return notification.NewNotification(queries.New(f.db), f.withTxn)
}

func (f *Factory) Invite() *invite.Invite {
	return invite.NewInvite(queries.New(f.db), f.withTxn)
}
