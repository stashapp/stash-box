package user

import (
	"github.com/stashapp/stash-box/internal/queries"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

func getNewUserTokenData(token queries.UserToken) (models.NewUserTokenData, error) {
	var obj models.NewUserTokenData
	err := utils.FromJSON(token.Data, &obj)
	return obj, err
}

func getUserTokenData(token queries.UserToken) (models.UserTokenData, error) {
	var obj models.UserTokenData
	err := utils.FromJSON(token.Data, &obj)
	return obj, err
}

func getChangeEmailTokenData(token queries.UserToken) (models.ChangeEmailTokenData, error) {
	var obj models.ChangeEmailTokenData
	err := utils.FromJSON(token.Data, &obj)
	return obj, err
}
