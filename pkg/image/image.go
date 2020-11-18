package image

import (
	"database/sql"
	"errors"
	"os"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stashdb/pkg/manager/config"
	"github.com/stashapp/stashdb/pkg/models"
)

func Create(repo models.ImageRepo, input models.ImageCreateInput) (*models.Image, error) {
	UUID, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}

	// Populate a new performer from the input
	newImage := models.Image{
		ID: UUID,
	}

	newImage.CopyFromCreateInput(input)

	// set RemoteURL from URL
	if input.URL != nil {
		newImage.RemoteURL = sql.NullString{
			String: *input.URL,
			Valid:  true,
		}
	}

	// handle image upload
	if input.File != nil {
		if err := config.ValidateImageLocation(); err != nil {
			return nil, err
		}

		checksum, err := saveFile(config.GetImageLocation(), *input.File)
		if err != nil {
			return nil, err
		}

		// check if image already exists with this checksum
		existing, err := repo.FindByChecksum(checksum)
		if err != nil {
			return nil, err
		}

		// if image already exists, just return it
		if existing != nil {
			return existing, nil
		}

		// set the checksum in the new image
		newImage.Checksum = sql.NullString{
			String: checksum,
			Valid:  true,
		}
	} else if input.URL != nil {
		return nil, errors.New("missing URL or file")
	}

	image, err := repo.Create(newImage)
	if err != nil {
		return nil, err
	}

	return image, nil
}

func Update(repo models.ImageRepo, input models.ImageUpdateInput) (*models.Image, error) {
	// get the existing image and modify it
	imageID, _ := uuid.FromString(input.ID)
	updatedImage, err := repo.Find(imageID)

	if err != nil {
		return nil, err
	}

	if updatedImage == nil {
		return nil, models.NotFoundError(imageID)
	}

	// Populate image from the input
	updatedImage.CopyFromUpdateInput(input)

	// set RemoteURL from URL
	if input.URL != nil {
		updatedImage.RemoteURL = sql.NullString{
			String: *input.URL,
			Valid:  true,
		}
	}

	// handle image upload
	if input.File != nil {
		if err := config.ValidateImageLocation(); err != nil {
			return nil, err
		}

		checksum, err := saveFile(config.GetImageLocation(), *input.File)
		if err != nil {
			return nil, err
		}

		// check if image already exists with this checksum
		existing, err := repo.FindByChecksum(checksum)
		if err != nil {
			return nil, err
		}

		// if image already exists, throw error
		if existing != nil {
			return nil, errors.New("image already exists with this checksum")
		}

		// set the checksum in the new image
		updatedImage.Checksum = sql.NullString{
			String: checksum,
			Valid:  true,
		}
	}

	image, err := repo.Update(*updatedImage)
	if err != nil {
		return nil, err
	}

	return image, nil
}

func Destroy(repo models.ImageRepo, input models.ImageDestroyInput) error {
	// references have on delete cascade, so shouldn't be necessary
	// to remove them explicitly
	imageID, err := uuid.FromString(input.ID)
	if err != nil {
		return err
	}

	i, err := repo.Find(imageID)
	if err != nil {
		return err
	}

	if err = repo.Destroy(imageID); err != nil {
		return err
	}

	// delete the file. Suppress any error
	if i.Checksum.Valid {
		os.Remove(GetImagePath(config.GetImageLocation(), i.Checksum.String))
	}

	return nil
}
