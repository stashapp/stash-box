package image

import (
	"bytes"
	"database/sql"
	"errors"
	"io"
	"strings"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/models"
)

type Service struct {
	Repository models.ImageRepo
	Backend    Backend
}

func (s *Service) Create(input models.ImageCreateInput) (*models.Image, error) {
	UUID, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}

	// Generate uuid that does not start with AD to prevent adblock issues
	for {
		if !strings.HasPrefix(UUID.String(), "ad") {
			break
		}
		UUID, err = uuid.NewV4()
		if err != nil {
			return nil, err
		}
	}

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
		if input.File.Size > int64(10*1024*1024) {
			return nil, errors.New("file too big")
		}

		file := make([]byte, input.File.Size)
		if _, err := input.File.File.Read(file); err != nil {
			return nil, err
		}
		fileReader := bytes.NewReader(file)

		checksum, err := calculateChecksum(fileReader)
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
		newImage.Checksum = checksum

		if _, err = fileReader.Seek(0, 0); err != nil {
			return nil, err
		}

		if err := populateImageDimensions(fileReader, &newImage); err != nil {
			return nil, err
		}

		if err := s.Backend.WriteFile(file, &newImage); err != nil {
			return nil, err
		}
	} else if input.URL != nil {
		return nil, errors.New("Missing URL or file")
	}

	image, err := s.Repository.Create(newImage)
	if err != nil {
		return nil, err
	}

	return image, nil
}

func (s *Service) Destroy(input models.ImageDestroyInput) error {
	// references have on delete cascade, so shouldn't be necessary
	// to remove them explicitly
	image, err := s.Repository.Find(input.ID)
	if err != nil {
		return err
	}

	if err = s.Repository.Destroy(input.ID); err != nil {
		return err
	}

	// delete the file. Suppress any error
	_ = s.Backend.DestroyFile(image)

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
				ID: i.ID,
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
			ID: imageID,
		})
		if err != nil {
			return err
		}
	}

	return nil
}

func (s *Service) Read(image models.Image) (io.ReadCloser, error) {
	return s.Backend.ReadFile(image)
}
