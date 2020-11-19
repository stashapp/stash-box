package image

import (
	"database/sql"
	"errors"
	"os"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stashdb/pkg/manager/config"
	"github.com/stashapp/stashdb/pkg/models"
)

func (s *Service) Create(input models.ImageCreateInput) (*models.Image, error) {
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
		existing, err := s.Repository.FindByChecksum(checksum)
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

		if err := populateImageDimensions(GetImagePath(config.GetImageLocation(), checksum), &newImage); err != nil {
			return nil, err
		}
	} else if input.URL != nil {
		return nil, errors.New("missing URL or file")
	}

	image, err := s.Repository.Create(newImage)
	if err != nil {
		return nil, err
	}

	return image, nil
}

func (s *Service) Update(input models.ImageUpdateInput) (*models.Image, error) {
	// get the existing image and modify it
	imageID, _ := uuid.FromString(input.ID)
	updatedImage, err := s.Repository.Find(imageID)

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
		existing, err := s.Repository.FindByChecksum(checksum)
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

		if err := populateImageDimensions(GetImagePath(config.GetImageLocation(), checksum), updatedImage); err != nil {
			return nil, err
		}
	}

	image, err := s.Repository.Update(*updatedImage)
	if err != nil {
		return nil, err
	}

	return image, nil
}

func (s *Service) Destroy(input models.ImageDestroyInput) error {
	// references have on delete cascade, so shouldn't be necessary
	// to remove them explicitly
	imageID, err := uuid.FromString(input.ID)
	if err != nil {
		return err
	}

	i, err := s.Repository.Find(imageID)
	if err != nil {
		return err
	}

	if err = s.Repository.Destroy(imageID); err != nil {
		return err
	}

	// delete the file. Suppress any error
	if i.Checksum.Valid {
		os.Remove(GetImagePath(config.GetImageLocation(), i.Checksum.String))
	}

	return nil
}

// DestroyUnusedImages destroys all images that are not used for a scene,
// performer or studio.
func (s *Service) DestroyUnusedImages() error {
	unused, err := s.Repository.FindUnused()
	if err != nil {
		return err
	}

	for len(unused) > 0 {
		for _, i := range unused {
			err = s.Destroy(models.ImageDestroyInput{
				ID: i.ID.String(),
			})
			if err != nil {
				return err
			}
		}

		unused, err = s.Repository.FindUnused()
		if err != nil {
			return err
		}
	}

	return nil
}

// DestroyUnusedImage destroys the image with the provided ID if it is not used for a scene,
// performer or studio.
func (s *Service) DestroyUnusedImage(imageID uuid.UUID) error {
	unused, err := s.Repository.IsUnused(imageID)
	if err != nil {
		return err
	}

	if unused {
		err = s.Destroy(models.ImageDestroyInput{
			ID: imageID.String(),
		})
		if err != nil {
			return err
		}
	}

	return nil
}
