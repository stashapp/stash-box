package site

import (
	"context"

	sq "github.com/Masterminds/squirrel"

	"github.com/stashapp/stash-box/internal/converter"
	"github.com/stashapp/stash-box/internal/models"
	queryhelper "github.com/stashapp/stash-box/internal/service/query"
)

func (s *Site) Query(ctx context.Context) ([]models.Site, int, error) {
	psql := sq.StatementBuilder.PlaceholderFormat(sq.Dollar)
	query := psql.Select("*").From("sites").OrderBy("name ASC")

	// Get count
	countQuery := psql.Select("COUNT(*)").From("sites")
	count, err := queryhelper.ExecuteCount(ctx, countQuery, s.queries.DB(), "QuerySitesCount")
	if err != nil {
		return nil, 0, err
	}

	// Execute query
	sites, err := queryhelper.ExecuteQuery(ctx, query, s.queries.DB(), converter.SiteToModel, "QuerySites")
	if err != nil {
		return nil, 0, err
	}

	return sites, count, nil
}
