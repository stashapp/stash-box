package cron

import (
	"github.com/robfig/cron/v3"
	"golang.org/x/sync/semaphore"

	"github.com/stashapp/stash-box/pkg/api"
	"github.com/stashapp/stash-box/pkg/logger"
	"github.com/stashapp/stash-box/pkg/manager/config"
	"github.com/stashapp/stash-box/pkg/manager/edit"
	"github.com/stashapp/stash-box/pkg/models"
)

var sem = semaphore.NewWeighted(1)

type EditCron struct {
	rfp api.RepoProvider
}

// processEdits runs at set intervals and closes edits where the voting period has ended,
// either by applying the edit if enough positive votes have been cast, or by rejecting it.
func (c EditCron) processEdits() {
	if !sem.TryAcquire(1) {
		logger.Debug("Edit cronjob failed to start, already running.")
	}
	defer sem.Release(1)

	edits, err := c.rfp.Repo().Edit().FindCompletedEdits(config.GetVotingPeriod(), config.GetMinDestructiveVotingPeriod(), config.GetVoteApplicationThreshold())
	if err != nil {
		logger.Errorf("Edit cronjob failed to fetch completed edits: %s", err.Error())
		return
	}

	logger.Debugf("Edit cronjob running for %d edits", len(edits))
	for _, e := range edits {
		if err := c.rfp.Repo().WithTxn(func() error {
			voteThreshold := 0
			if e.IsDestructive() {
				// Require at least +1 votes to pass destructive edits
				voteThreshold = 1
			}

			var err error
			if e.VoteCount >= voteThreshold {
				_, err = edit.ApplyEdit(c.rfp.Repo(), e.ID, false)
			} else {
				_, err = edit.CloseEdit(c.rfp.Repo(), e.ID, models.VoteStatusEnumRejected)
			}
			return err
		}); err != nil {
			logger.Errorf("Edit cronjob failed to apply edit %s: %s", e.ID.String(), err.Error())
		}
	}
}

func Init(rfp api.RepoProvider) {
	c := cron.New()
	editCron := EditCron{rfp}

	interval := config.GetVoteCronInterval()
	if interval != "" {
		_, err := c.AddFunc("@every "+config.GetVoteCronInterval(), editCron.processEdits)
		if err != nil {
			panic(err.Error())
		}

		c.Start()
		logger.Debugf("Edit cronjob initialized to run every %s", interval)
	}
}
