package dataloader

import (
	"time"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/models"
)

// EditCommentsLoader loads [][]models.EditComment by edit id
type EditCommentsLoader struct {
	fetch    func(keys []uuid.UUID) ([][]models.EditComment, []error)
	wait     time.Duration
	maxBatch int
}

func (l *EditCommentsLoader) Load(key uuid.UUID) ([]models.EditComment, error) {
	res, errs := l.LoadAll([]uuid.UUID{key})
	if len(errs) > 0 && errs[0] != nil {
		return nil, errs[0]
	}
	if len(res) > 0 && len(res[0]) > 0 {
		return res[0], nil
	}
	return nil, nil
}

func (l *EditCommentsLoader) LoadAll(keys []uuid.UUID) ([][]models.EditComment, []error) {
	if len(keys) == 0 {
		return nil, nil
	}
	return l.fetch(keys)
}
