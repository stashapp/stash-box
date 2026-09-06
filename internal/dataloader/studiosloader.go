package dataloader

import (
	"time"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/models"
)

type StudiosLoader struct {
	fetch    func(keys []uuid.UUID) ([][]models.Studio, []error)
	wait     time.Duration
	maxBatch int
}

func (l *StudiosLoader) Load(key uuid.UUID) ([]models.Studio, error) {
	res, errs := l.LoadAll([]uuid.UUID{key})
	if len(errs) > 0 && errs[0] != nil {
		return nil, errs[0]
	}
	if len(res) > 0 {
		return res[0], nil
	}
	return nil, nil
}

func (l *StudiosLoader) LoadAll(keys []uuid.UUID) ([][]models.Studio, []error) {
	if len(keys) == 0 {
		return nil, nil
	}
	return l.fetch(keys)
}
