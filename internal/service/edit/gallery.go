package edit

import (
	"context"
	"fmt"
	"reflect"
	"slices"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
	"github.com/stashapp/stash-box/internal/service/gallery"
	"github.com/stashapp/stash-box/pkg/utils"
)

type GalleryEditProcessor struct{ mutator }

func Gallery(ctx context.Context, queries *queries.Queries, edit *models.Edit) *GalleryEditProcessor {
	return &GalleryEditProcessor{mutator{context: ctx, queries: queries, edit: edit}}
}

func (m *GalleryEditProcessor) Edit(input models.GalleryEditInput, args utils.ArgumentsQuery, update bool) error {
	if err := m.validate(input, update); err != nil {
		return err
	}
	switch input.Edit.Operation {
	case models.OperationEnumCreate:
		if input.Details == nil {
			return fmt.Errorf("gallery details are required")
		}

		data := models.GalleryEditData{New: &models.GalleryEdit{
			Title: input.Details.Title, Code: input.Details.Code, Date: input.Details.Date,
			Photographer: input.Details.Photographer, Details: input.Details.Details,
			StudioID: input.Details.StudioID, CoverImageID: input.Details.CoverImageID,
			AddedUrls: input.Details.Urls, AddedPerformers: input.Details.Performers,
			AddedScenes: input.Details.SceneIds, AddedTags: input.Details.TagIds,
			Images: input.Details.Images, DraftID: input.Details.DraftID,
		}}
		if update {
			existing, err := m.edit.GetGalleryData()
			if err != nil {
				return err
			}
			if existing.New != nil {
				data.New.DraftID = existing.New.DraftID
			}
		}
		return m.edit.SetData(data)
	case models.OperationEnumModify, models.OperationEnumMerge:
		return m.diff(input, args, update)
	case models.OperationEnumDestroy:
		return m.validateTarget(input)
	}
	return nil
}

func (m *GalleryEditProcessor) validate(input models.GalleryEditInput, update bool) error {
	if input.Details == nil {
		return nil
	}
	if input.Edit.Operation != models.OperationEnumCreate && len(input.Details.Images) > 0 {
		return fmt.Errorf("existing gallery image metadata is immutable; only image tags may be edited")
	}
	details := input.Details
	if details.DraftID != nil {
		if err := validateDraftID(m.context, m.queries, *details.DraftID, m.edit.ID, update); err != nil {
			return err
		}
	}
	if err := models.ValidateGalleryImages(
		details.Images,
		func(image models.GalleryImageInput) int { return image.Index },
		func(image models.GalleryImageInput) models.FingerprintHash { return image.PHash },
	); err != nil {
		return err
	}
	if details.StudioID != nil {
		if _, err := m.queries.FindStudio(m.context, *details.StudioID); err != nil {
			return fmt.Errorf("%w: %s", ErrInvalidStudio, *details.StudioID)
		}
	}
	if details.CoverImageID != nil {
		images, err := m.queries.FindImagesByIds(m.context, []uuid.UUID{*details.CoverImageID})
		if err != nil || len(images) != 1 {
			return fmt.Errorf("%w: %w", ErrInvalidImage, err)
		}
	}
	if len(details.TagIds) > 0 {
		tags, err := m.queries.FindTagsByIds(m.context, details.TagIds)
		if err != nil || len(tags) < len(details.TagIds) {
			return fmt.Errorf("%w: %w", ErrInvalidTag, err)
		}
	}
	if len(details.Performers) > 0 {
		ids := make([]uuid.UUID, len(details.Performers))
		for i := range details.Performers {
			ids[i] = details.Performers[i].PerformerID
		}
		performers, err := m.queries.FindPerformersByIds(m.context, ids)
		if err != nil || len(performers) < len(ids) {
			return fmt.Errorf("%w: %w", ErrInvalidPerformer, err)
		}
	}
	if len(details.SceneIds) > 0 {
		scenes, err := m.queries.GetScenes(m.context, details.SceneIds)
		if err != nil || len(scenes) < len(details.SceneIds) {
			return fmt.Errorf("invalid gallery scene: %w", err)
		}
	}
	for _, update := range details.ImageTagUpdates {
		tags, err := m.queries.FindTagsByIds(m.context, update.TagIds)
		if err != nil || len(tags) < len(update.TagIds) {
			return fmt.Errorf("%w: %w", ErrInvalidTag, err)
		}
	}
	for _, image := range details.Images {
		ids := make([]uuid.UUID, 0, len(image.Tags))
		for _, tag := range image.Tags {
			if tag.TagID != nil {
				ids = append(ids, *tag.TagID)
			}
		}
		tags, err := m.queries.FindTagsByIds(m.context, ids)
		if err != nil || len(tags) < len(ids) {
			return fmt.Errorf("%w: %w", ErrInvalidTag, err)
		}
	}
	return validateURLs(m.context, m.queries, details.Urls)
}

func (m *GalleryEditProcessor) diff(input models.GalleryEditInput, args utils.ArgumentsQuery, update bool) error {
	if input.Edit.ID == nil || input.Details == nil {
		return ErrMergeIDMissing
	}
	g, err := m.loadGallery(*input.Edit.ID)
	if err != nil {
		return err
	}
	if input.Edit.Operation == models.OperationEnumMerge {
		if len(input.Edit.MergeSourceIds) == 0 {
			return ErrNoMergeSources
		}
		for _, id := range input.Edit.MergeSourceIds {
			if id == g.ID {
				return ErrMergeTargetIsSource
			}
			if _, err := m.loadGallery(id); err != nil {
				return err
			}
		}
	}
	detailsArgs := args.Field("details")
	old, newData, err := galleryScalarDiff(g, input.Details, detailsArgs)
	if err != nil {
		return err
	}

	if input.Details.Urls != nil || detailsArgs.Field("urls").IsNull() {
		urls, err := m.loadURLs(g.ID)
		if err != nil {
			return err
		}
		newData.AddedUrls, newData.RemovedUrls = urlCompare(input.Details.Urls, urls)
		old.AddedUrls, old.RemovedUrls = newData.RemovedUrls, newData.AddedUrls
	}

	if input.Details.Performers != nil || detailsArgs.Field("performers").IsNull() {
		performers, err := m.loadPerformerInputs(g.ID)
		if err != nil {
			return err
		}
		newData.AddedPerformers, newData.RemovedPerformers = performerInputCompare(input.Details.Performers, performers)
		old.AddedPerformers, old.RemovedPerformers = newData.RemovedPerformers, newData.AddedPerformers
	}

	scenes, tags, err := m.loadRelationshipIDs(g.ID)
	if err != nil {
		return err
	}
	if input.Details.SceneIds != nil || detailsArgs.Field("scene_ids").IsNull() {
		newData.AddedScenes, newData.RemovedScenes = utils.SliceCompare(input.Details.SceneIds, scenes)
		old.AddedScenes, old.RemovedScenes = newData.RemovedScenes, newData.AddedScenes
	}
	if input.Details.TagIds != nil || detailsArgs.Field("tag_ids").IsNull() {
		newData.AddedTags, newData.RemovedTags = utils.SliceCompare(input.Details.TagIds, tags)
		old.AddedTags, old.RemovedTags = newData.RemovedTags, newData.AddedTags
	}
	newData.ImageTagUpdates, err = m.diffImageTags(g.ID, input.Details.ImageTagUpdates)
	if err != nil {
		return err
	}
	newData.DraftID = input.Details.DraftID

	data := models.GalleryEditData{New: newData, Old: old}
	data.OldNullFields = galleryNullOldFields(g, input.Details)
	if input.Edit.Operation == models.OperationEnumMerge {
		data.MergeSources = input.Edit.MergeSourceIds
	}

	if reflect.DeepEqual(data.New, data.Old) {
		return ErrNoChanges
	}
	return m.edit.SetData(data)
}

func galleryNullOldFields(g *models.Gallery, in *models.GalleryEditDetailsInput) []string {
	var fields []string
	if in.Title != nil && g.Title == nil {
		fields = append(fields, "title")
	}
	if in.Code != nil && g.Code == nil {
		fields = append(fields, "code")
	}
	if in.Date != nil && g.Date == nil {
		fields = append(fields, "date")
	}
	if in.Photographer != nil && g.Photographer == nil {
		fields = append(fields, "photographer")
	}
	if in.Details != nil && g.Details == nil {
		fields = append(fields, "details")
	}
	if in.StudioID != nil && !g.StudioID.Valid {
		fields = append(fields, "studio_id")
	}
	if in.CoverImageID != nil && !g.CoverImageID.Valid {
		fields = append(fields, "cover_image_id")
	}
	return fields
}

func galleryScalarDiff(g *models.Gallery, in *models.GalleryEditDetailsInput, args utils.ArgumentsQuery) (*models.GalleryEdit, *models.GalleryEdit, error) {
	old := &models.GalleryEdit{}
	newData := &models.GalleryEdit{}
	if (in.Title != nil || args.Field("title").IsNull()) && !reflect.DeepEqual(in.Title, g.Title) {
		old.Title, newData.Title = g.Title, in.Title
	}
	if (in.Code != nil || args.Field("code").IsNull()) && !reflect.DeepEqual(in.Code, g.Code) {
		old.Code, newData.Code = g.Code, in.Code
	}
	if (in.Date != nil || args.Field("date").IsNull()) && !reflect.DeepEqual(in.Date, g.Date) {
		old.Date, newData.Date = g.Date, in.Date
	}
	if (in.Photographer != nil || args.Field("photographer").IsNull()) && !reflect.DeepEqual(in.Photographer, g.Photographer) {
		old.Photographer, newData.Photographer = g.Photographer, in.Photographer
	}
	if (in.Details != nil || args.Field("details").IsNull()) && !reflect.DeepEqual(in.Details, g.Details) {
		old.Details, newData.Details = g.Details, in.Details
	}
	studioIDPresent := in.StudioID != nil || args.Field("studio_id").IsNull()
	if studioIDPresent && ((in.StudioID == nil && g.StudioID.Valid) || (in.StudioID != nil && (!g.StudioID.Valid || *in.StudioID != g.StudioID.UUID))) {
		if g.StudioID.Valid {
			id := g.StudioID.UUID
			old.StudioID = &id
		}
		newData.StudioID = in.StudioID
	}
	coverPresent := in.CoverImageID != nil || args.Field("cover_image_id").IsNull()
	if coverPresent && ((in.CoverImageID == nil && g.CoverImageID.Valid) || (in.CoverImageID != nil && (!g.CoverImageID.Valid || *in.CoverImageID != g.CoverImageID.UUID))) {
		if g.CoverImageID.Valid {
			id := g.CoverImageID.UUID
			old.CoverImageID = &id
		}
		newData.CoverImageID = in.CoverImageID
	}
	return old, newData, nil
}

func (m *GalleryEditProcessor) loadGallery(id uuid.UUID) (*models.Gallery, error) {
	s := gallery.NewGallery(m.queries, func(fn func(*queries.Queries) error) error { return fn(m.queries) })
	return s.FindByID(m.context, id)
}

func (m *GalleryEditProcessor) loadURLs(id uuid.UUID) ([]models.URL, error) {
	rows, err := m.queries.DB().Query(m.context, "SELECT url, site_id FROM gallery_urls WHERE gallery_id = $1", id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []models.URL
	for rows.Next() {
		var item models.URL
		if err := rows.Scan(&item.URL, &item.SiteID); err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	return result, rows.Err()
}

func (m *GalleryEditProcessor) loadPerformerInputs(id uuid.UUID) ([]models.PerformerAppearanceInput, error) {
	rows, err := m.queries.DB().Query(m.context, `SELECT performer_id, "as" FROM gallery_performers WHERE gallery_id = $1`, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []models.PerformerAppearanceInput
	for rows.Next() {
		var item models.PerformerAppearanceInput
		if err := rows.Scan(&item.PerformerID, &item.As); err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	return result, rows.Err()
}

func performerInputCompare(subject, against []models.PerformerAppearanceInput) (added, removed []models.PerformerAppearanceInput) {
	key := func(value models.PerformerAppearanceInput) string {
		alias := ""
		if value.As != nil {
			alias = *value.As
		}
		return value.PerformerID.String() + "\x00" + alias
	}
	seen := make(map[string]bool)
	for _, item := range subject {
		seen[key(item)] = true
	}
	for _, item := range against {
		if !seen[key(item)] {
			removed = append(removed, item)
		}
	}
	seen = make(map[string]bool)
	for _, item := range against {
		seen[key(item)] = true
	}
	for _, item := range subject {
		if !seen[key(item)] {
			added = append(added, item)
		}
	}
	return
}

func (m *GalleryEditProcessor) loadRelationshipIDs(id uuid.UUID) ([]uuid.UUID, []uuid.UUID, error) {
	s := gallery.NewGallery(m.queries, func(fn func(*queries.Queries) error) error { return fn(m.queries) })
	scenes, err := s.GetScenes(m.context, id)
	if err != nil {
		return nil, nil, err
	}
	tags, err := s.GetTags(m.context, id)
	return scenes, tags, err
}

func (m *GalleryEditProcessor) diffImageTags(galleryID uuid.UUID, input []models.GalleryImageTagEditInput) ([]models.GalleryImageTagUpdate, error) {
	var result []models.GalleryImageTagUpdate
	for _, update := range input {
		image, err := gallery.NewGallery(m.queries, func(fn func(*queries.Queries) error) error { return fn(m.queries) }).
			FindImageByGalleryIndex(m.context, galleryID, update.Index)
		if err != nil {
			return nil, err
		}
		current := make([]uuid.UUID, 0, len(image.Tags))
		for _, tag := range image.Tags {
			if tag.TagID != nil {
				current = append(current, *tag.TagID)
			}
		}
		added, removed := utils.SliceCompare(update.TagIds, current)
		if len(added) > 0 || len(removed) > 0 {
			result = append(result, models.GalleryImageTagUpdate{Index: update.Index, AddedTags: added, RemovedTags: removed})
		}
	}
	return result, nil
}

func (m *GalleryEditProcessor) validateTarget(input models.GalleryEditInput) error {
	if input.Edit.ID == nil {
		return ErrEntityNotFound
	}
	_, err := m.loadGallery(*input.Edit.ID)
	return err
}

func (m *GalleryEditProcessor) CreateJoin(input models.GalleryEditInput) error {
	if input.Edit.ID == nil {
		return nil
	}
	_, err := m.queries.DB().Exec(m.context, "INSERT INTO gallery_edits (edit_id, gallery_id) VALUES ($1, $2)", m.edit.ID, *input.Edit.ID)
	return err
}

func (m *GalleryEditProcessor) apply() error {
	data, err := m.edit.GetGalleryData()
	if err != nil {
		return err
	}
	if m.operation() != models.OperationEnumDestroy && data.New == nil {
		return fmt.Errorf("missing gallery edit data")
	}
	switch m.operation() {
	case models.OperationEnumCreate:
		id := data.New.DraftID
		if id == nil {
			value, err := uuid.NewV7()
			if err != nil {
				return err
			}
			id = &value
		}
		service := gallery.NewGallery(m.queries, func(fn func(*queries.Queries) error) error { return fn(m.queries) })
		created, err := service.CreateWithID(m.context, *id, models.GalleryCreateInput{
			Title: data.New.Title, Code: data.New.Code, Date: data.New.Date,
			Photographer: data.New.Photographer, Details: data.New.Details,
			StudioID: data.New.StudioID, CoverImageID: data.New.CoverImageID,
			URLs: data.New.AddedUrls, Performers: data.New.AddedPerformers,
			SceneIDs: data.New.AddedScenes, TagIDs: data.New.AddedTags, Images: data.New.Images,
		})
		_ = created
		if err != nil {
			return err
		}
		_, err = m.queries.DB().Exec(m.context, "INSERT INTO gallery_edits (edit_id, gallery_id) VALUES ($1, $2)", m.edit.ID, *id)
		return err
	case models.OperationEnumDestroy:
		target, err := m.targetID()
		if err != nil {
			return err
		}
		_, err = m.queries.DB().Exec(m.context, "UPDATE galleries SET deleted = TRUE, updated_at = NOW() WHERE id = $1", target)
		if err != nil {
			return err
		}
		if err = m.queries.DeleteGalleryURLs(m.context, target); err != nil {
			return err
		}
		if err = m.queries.DeleteGalleryPerformers(m.context, target); err != nil {
			return err
		}
		if err = m.queries.DeleteGalleryTags(m.context, target); err != nil {
			return err
		}
		if err = m.queries.DeleteGalleryScenes(m.context, target); err != nil {
			return err
		}
		return m.queries.DeleteGalleryImages(m.context, target)
	default:
		if data.New == nil {
			return fmt.Errorf("missing gallery edit data")
		}
		target, err := m.targetID()
		if err != nil {
			return err
		}
		g, err := m.loadGallery(target)
		if err != nil {
			return err
		}
		if err := m.applyModify(g, data); err != nil {
			return err
		}
		if m.operation() == models.OperationEnumMerge {
			service := gallery.NewGallery(m.queries, func(fn func(*queries.Queries) error) error { return fn(m.queries) })
			for _, source := range data.MergeSources {
				if source == target {
					return ErrMergeTargetIsSource
				}
				sourceImages, err := service.GetImages(m.context, source)
				if err != nil {
					return err
				}
				for _, image := range sourceImages {
					targetImage, err := service.FindImageByPHash(m.context, target, image.PHash)
					if err != nil {
						return err
					}
					if targetImage != nil {
						existingTagIDs := make([]uuid.UUID, 0, len(targetImage.Tags))
						for _, tag := range targetImage.Tags {
							if tag.TagID != nil {
								existingTagIDs = append(existingTagIDs, *tag.TagID)
							}
						}
						mergedTagIDs := existingTagIDs
						for _, tag := range image.Tags {
							if tag.TagID != nil && !slices.Contains(mergedTagIDs, *tag.TagID) {
								mergedTagIDs = append(mergedTagIDs, *tag.TagID)
							}
						}
						tagInputs := make([]models.GalleryImageTagInput, len(mergedTagIDs))
						for i := range mergedTagIDs {
							tagID := mergedTagIDs[i]
							tagInputs[i] = models.GalleryImageTagInput{TagID: &tagID}
						}
						if err := service.SetImageTags(m.context, targetImage.ID, tagInputs); err != nil {
							return err
						}
						continue
					}
					tags := make([]models.GalleryImageTagInput, 0, len(image.Tags))
					for _, tag := range image.Tags {
						if tag.TagID != nil {
							tagID := *tag.TagID
							tags = append(tags, models.GalleryImageTagInput{TagID: &tagID})
						}
					}
					if _, err := service.CreateImage(m.context, target, models.GalleryImageInput{
						PHash: image.PHash,
						Tags:  tags,
					}); err != nil {
						return err
					}
				}
				if _, err := m.queries.DB().Exec(m.context, "UPDATE galleries SET deleted = TRUE, updated_at = NOW() WHERE id = $1", source); err != nil {
					return err
				}
			}
		}
		return nil
	}
}

func (m *GalleryEditProcessor) applyModify(g *models.Gallery, data *models.GalleryEditData) error {
	if err := g.ValidateModifyEdit(*data); err != nil {
		return err
	}
	g.CopyFromGalleryEdit(*data.New, data.Old)
	service := gallery.NewGallery(m.queries, func(fn func(*queries.Queries) error) error { return fn(m.queries) })
	urls, err := m.loadURLs(g.ID)
	if err != nil {
		return err
	}
	urls = applyURLs(urls, data.New.AddedUrls, data.New.RemovedUrls)
	performers, err := m.loadPerformerInputs(g.ID)
	if err != nil {
		return err
	}
	performers = applyUUIDDiff(performers, data.New.AddedPerformers, data.New.RemovedPerformers, performerInputCompare)
	scenes, tags, err := m.loadRelationshipIDs(g.ID)
	if err != nil {
		return err
	}
	scenes = applyUUIDs(scenes, data.New.AddedScenes, data.New.RemovedScenes)
	tags = applyUUIDs(tags, data.New.AddedTags, data.New.RemovedTags)
	if err := service.Replace(m.context, g, urls, performers, tags, scenes); err != nil {
		return err
	}
	for _, update := range data.New.ImageTagUpdates {
		image, err := service.FindImageByGalleryIndex(m.context, g.ID, update.Index)
		if err != nil {
			return err
		}
		existing := make([]uuid.UUID, 0, len(image.Tags))
		for _, tag := range image.Tags {
			if tag.TagID != nil {
				existing = append(existing, *tag.TagID)
			}
		}
		tagInputs := make([]models.GalleryImageTagInput, 0, len(existing))
		for _, id := range applyUUIDs(existing, update.AddedTags, update.RemovedTags) {
			id := id
			tagInputs = append(tagInputs, models.GalleryImageTagInput{TagID: &id})
		}
		if err := service.SetImageTags(m.context, image.ID, tagInputs); err != nil {
			return err
		}
	}
	return nil
}

func (m *GalleryEditProcessor) targetID() (uuid.UUID, error) {
	row, err := m.queries.GetEditTargetID(m.context, m.edit.ID)
	return row.ID, err
}

func applyURLs(existing, added, removed []models.URL) []models.URL {
	result := append([]models.URL(nil), existing...)
	for _, remove := range removed {
		filtered := result[:0]
		for _, item := range result {
			if item.URL != remove.URL || item.SiteID != remove.SiteID {
				filtered = append(filtered, item)
			}
		}
		result = filtered
	}
	for _, add := range added {
		found := false
		for _, item := range result {
			if item.URL == add.URL && item.SiteID == add.SiteID {
				found = true
				break
			}
		}
		if !found {
			result = append(result, add)
		}
	}
	return result
}

func applyUUIDs(existing, added, removed []uuid.UUID) []uuid.UUID {
	result := append([]uuid.UUID(nil), existing...)
	remove := make(map[uuid.UUID]bool, len(removed))
	for _, id := range removed {
		remove[id] = true
	}
	result = result[:0]
	for _, id := range existing {
		if !remove[id] {
			result = append(result, id)
		}
	}
	seen := make(map[uuid.UUID]bool, len(result))
	for _, id := range result {
		seen[id] = true
	}
	for _, id := range added {
		if !seen[id] {
			result = append(result, id)
		}
	}
	return result
}

func applyUUIDDiff(existing, added, removed []models.PerformerAppearanceInput, _ func([]models.PerformerAppearanceInput, []models.PerformerAppearanceInput) ([]models.PerformerAppearanceInput, []models.PerformerAppearanceInput)) []models.PerformerAppearanceInput {
	result := append([]models.PerformerAppearanceInput(nil), existing...)
	for _, value := range removed {
		for i := range result {
			if result[i].PerformerID == value.PerformerID && reflect.DeepEqual(result[i].As, value.As) {
				result = append(result[:i], result[i+1:]...)
				break
			}
		}
	}
	for _, value := range added {
		result = append(result, value)
	}
	return result
}
