package cron

import (
	"context"

	"github.com/robfig/cron/v3"
	"golang.org/x/sync/semaphore"

	"github.com/stashapp/stash-box/internal/config"
	"github.com/stashapp/stash-box/internal/service"
	"github.com/stashapp/stash-box/pkg/logger"
)

var sem = semaphore.NewWeighted(1)

type Cron struct {
	fac service.Factory
}

// processEdits runs at set intervals and closes edits where the voting period has ended,
// either by applying the edit if enough positive votes have been cast, or by rejecting it.
func (c Cron) processEdits() {
	if !sem.TryAcquire(1) {
		logger.Debug("Edit cronjob failed to start, already running.")
	}
	defer sem.Release(1)

	ctx := context.Background()
	err := c.fac.Edit().CloseCompleted(ctx)

	if err != nil {
		logger.Errorf("Error processing edits: %s", err)
	}
}

func (c Cron) cleanDrafts() {
	ctx := context.Background()
	err := c.fac.Draft().DeleteExpired(ctx)

	if err != nil {
		logger.Errorf("Error cleaning drafts: %s", err)
	}
}

func (c Cron) cleanTokens() {
	ctx := context.Background()
	err := c.fac.UserToken().DestroyExpired(ctx)

	if err != nil {
		logger.Errorf("Error cleaning user tokens: %s", err)
	}
}

func (c Cron) cleanInvites() {
	ctx := context.Background()
	err := c.fac.Invite().DestroyExpired(ctx)

	if err != nil {
		logger.Errorf("Error cleaning invites: %s", err)
	}
}

func (c Cron) cleanNotifications() {
	ctx := context.Background()

	err := c.fac.Notification().DestroyExpired(ctx)
	if err != nil {
		logger.Errorf("Error cleaning notifications: %s", err)
	}
}

func Init(fac service.Factory) {
	c := cron.New()
	cronJobs := Cron{fac}

	_, err := c.AddFunc("@every 5m", cronJobs.cleanDrafts)
	if err != nil {
		panic(err.Error())
	}

	_, err = c.AddFunc("@every 1m", cronJobs.cleanTokens)
	if err != nil {
		panic(err.Error())
	}

	_, err = c.AddFunc("@every 60m", cronJobs.cleanNotifications)
	if err != nil {
		panic(err.Error())
	}

	_, err = c.AddFunc("@every 60m", cronJobs.cleanInvites)
	if err != nil {
		panic(err.Error())
	}

	interval := config.GetVoteCronInterval()
	if interval != "" {
		_, err := c.AddFunc("@every "+config.GetVoteCronInterval(), cronJobs.processEdits)
		if err != nil {
			panic(err.Error())
		}

		c.Start()
		logger.Debugf("Edit cronjob initialized to run every %s", interval)
	}
}
