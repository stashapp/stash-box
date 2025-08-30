package user

import (
	"github.com/stashapp/stash-box/internal/db"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

func getNewUserTokenData(token db.UserToken) (models.NewUserTokenData, error) {
	var obj models.NewUserTokenData
	err := utils.FromJSON(token.Data, &obj)
	return obj, err
}

func getUserTokenData(token db.UserToken) (models.UserTokenData, error) {
	var obj models.UserTokenData
	err := utils.FromJSON(token.Data, &obj)
	return obj, err
}

func getChangeEmailTokenData(token db.UserToken) (models.ChangeEmailTokenData, error) {
	var obj models.ChangeEmailTokenData
	err := utils.FromJSON(token.Data, &obj)
	return obj, err
}
