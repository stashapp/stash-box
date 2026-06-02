package cron

import (
	"context"

	"github.com/robfig/cron/v3"
	"go.opentelemetry.io/otel"
	"golang.org/x/sync/semaphore"

	"github.com/stashapp/stash-box/internal/autocert"
	"github.com/stashapp/stash-box/internal/config"
	"github.com/stashapp/stash-box/internal/service"
	"github.com/stashapp/stash-box/internal/tracing"
	"github.com/stashapp/stash-box/pkg/logger"
)

const tracerName = "github.com/stashapp/stash-box/internal/cron"

var sem = semaphore.NewWeighted(1)

type Cron struct {
	fac service.Factory
}

// processEdits runs at set intervals and closes edits where the voting period has ended,
// either by applying the edit if enough positive votes have been cast, or by rejecting it.
func (c Cron) processEdits() {
	if !sem.TryAcquire(1) {
		logger.Debug("Edit cronjob failed to start, already running.")
		return
	}
	defer sem.Release(1)

	ctx, span := otel.Tracer(tracerName).Start(context.Background(), "cron.processEdits")
	defer span.End()

	closedEdits, err := c.fac.Edit().CloseCompleted(ctx)
	tracing.RecordError(span, err)
	if err != nil {
		logger.Errorf("Error processing edits: %s", err)
	}

	// Trigger notifications for all closed edits
	for _, edit := range closedEdits {
		c.fac.Notification().OnApplyEdit(ctx, edit)
	}
}

func (c Cron) cleanDrafts() {
	ctx, span := otel.Tracer(tracerName).Start(context.Background(), "cron.cleanDrafts")
	defer span.End()

	err := c.fac.Draft().DeleteExpired(ctx)
	tracing.RecordError(span, err)
	if err != nil {
		logger.Errorf("Error cleaning drafts: %s", err)
	}
}

func (c Cron) cleanTokens() {
	ctx, span := otel.Tracer(tracerName).Start(context.Background(), "cron.cleanTokens")
	defer span.End()

	err := c.fac.UserToken().DestroyExpired(ctx)
	tracing.RecordError(span, err)
	if err != nil {
		logger.Errorf("Error cleaning user tokens: %s", err)
	}
}

func (c Cron) cleanInvites() {
	ctx, span := otel.Tracer(tracerName).Start(context.Background(), "cron.cleanInvites")
	defer span.End()

	err := c.fac.Invite().DestroyExpired(ctx)
	tracing.RecordError(span, err)
	if err != nil {
		logger.Errorf("Error cleaning invites: %s", err)
	}
}

func (c Cron) cleanNotifications() {
	ctx, span := otel.Tracer(tracerName).Start(context.Background(), "cron.cleanNotifications")
	defer span.End()

	err := c.fac.Notification().DestroyExpired(ctx)
	tracing.RecordError(span, err)
	if err != nil {
		logger.Errorf("Error cleaning notifications: %s", err)
	}
}

func (c Cron) refreshPopularityTrending() {
	ctx, span := otel.Tracer(tracerName).Start(context.Background(), "cron.refreshPopularityTrending")
	defer span.End()

	if err := c.fac.Scene().RefreshPopularityTrending(ctx); err != nil {
		tracing.RecordError(span, err)
		logger.Errorf("Error refreshing scene popularity trending: %s", err)
	}
}

func (c Cron) refreshPopularityAlltime() {
	ctx, span := otel.Tracer(tracerName).Start(context.Background(), "cron.refreshPopularityAlltime")
	defer span.End()

	if err := c.fac.Scene().RefreshPopularityAlltime(ctx); err != nil {
		tracing.RecordError(span, err)
		logger.Errorf("Error refreshing scene popularity alltime: %s", err)
	}
	if err := c.fac.Performer().RefreshPopularityAlltime(ctx); err != nil {
		tracing.RecordError(span, err)
		logger.Errorf("Error refreshing performer popularity alltime: %s", err)
	}
}

func (c Cron) cleanModAudits() {
	retentionDays := config.GetModAuditRetentionDays()
	if retentionDays <= 0 {
		return
	}

	ctx, span := otel.Tracer(tracerName).Start(context.Background(), "cron.cleanModAudits")
	defer span.End()

	err := c.fac.ModAudit().DeleteExpired(ctx, retentionDays)
	tracing.RecordError(span, err)
	if err != nil {
		logger.Errorf("Error cleaning mod audit logs: %s", err)
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

	_, err = c.AddFunc("@every 12h", cronJobs.cleanModAudits)
	if err != nil {
		panic(err.Error())
	}

	_, err = c.AddFunc("@every 1h", cronJobs.refreshPopularityTrending)
	if err != nil {
		panic(err.Error())
	}

	_, err = c.AddFunc("@daily", cronJobs.refreshPopularityAlltime)
	if err != nil {
		panic(err.Error())
	}

	if config.GetAutocertConfig() != nil {
		_, err = c.AddFunc("@daily", autocert.CheckAndRenew)
		if err != nil {
			panic(err.Error())
		}
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
