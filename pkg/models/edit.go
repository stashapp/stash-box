package models

import "github.com/gofrs/uuid"

type EditRepo interface {
	Create(newEdit Edit) (*Edit, error)
	Update(updatedEdit Edit) (*Edit, error)
	Destroy(id uuid.UUID) error
	Find(id uuid.UUID) (*Edit, error)
	CreateEditTag(newJoin EditTag) error
	CreateEditPerformer(newJoin EditPerformer) error
	CreateEditStudio(newJoin EditStudio) error
	CreateEditScene(newJoin EditScene) error
	FindTagID(id uuid.UUID) (*uuid.UUID, error)
	FindPerformerID(id uuid.UUID) (*uuid.UUID, error)
	FindStudioID(id uuid.UUID) (*uuid.UUID, error)
	FindSceneID(id uuid.UUID) (*uuid.UUID, error)
	Count() (int, error)
	QueryEdits(filter EditQueryInput, userID uuid.UUID) ([]*Edit, error)
	QueryCount(filter EditQueryInput, userID uuid.UUID) (int, error)
	CreateComment(newJoin EditComment) error
	CreateVote(newJoin EditVote) error
	GetComments(id uuid.UUID) (EditComments, error)
	GetVotes(id uuid.UUID) (EditVotes, error)
	FindByTagID(id uuid.UUID) ([]*Edit, error)
	FindByPerformerID(id uuid.UUID) ([]*Edit, error)
	FindByStudioID(id uuid.UUID) ([]*Edit, error)
	FindBySceneID(id uuid.UUID) ([]*Edit, error)
	FindCompletedEdits(int, int, int) ([]*Edit, error)
	FindPendingPerformerCreation(input QueryExistingPerformerInput) ([]*Edit, error)
	FindPendingSceneCreation(input QueryExistingSceneInput) ([]*Edit, error)
	CancelUserEdits(userID uuid.UUID) error
}
