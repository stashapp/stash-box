package image

import (
	"bytes"
	"database/sql"
	"errors"
	"path/filepath"
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

	// Generate uuid that does not start with "ad" to prevent adblock issues
	// see https://discord.com/channels/559159668438728723/642050893549928449/831269018454851644
	// if the UUID starts with "ad" the final URL with be "/ad/xx/xxxx" which can be blocked by some
	// adblockers
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
		extension := strings.ToLower(filepath.Ext(input.File.Filename))
		isSVG := extension == ".svg"

		var imageReader *bytes.Reader

		// Studio images can be SVGs and should not be converted
		if isSVG {
			file := make([]byte, input.File.Size)
			if _, err := input.File.File.Read(file); err != nil {
				return nil, err
			}

			imageReader = bytes.NewReader(file)
		} else {
			manipulatedImage, err := manipulateImage(input.File.File)
			if err != nil {
				return nil, err
			}

			if manipulatedImage == nil {
				// image doesn't need to be manipulated, the original image
				// can be used

				// reset to start
				if _, err = input.File.File.Seek(0, 0); err != nil {
					return nil, err
				}

				file := make([]byte, input.File.Size)
				if _, err := input.File.File.Read(file); err != nil {
					return nil, err
				}

				imageReader = bytes.NewReader(file)
			} else {
				// use the manipulated image
				imageReader = manipulatedImage
			}
		}

		checksum, err := calculateChecksum(imageReader)
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

		if isSVG {
			// vectore images don't have pixel width/height
			newImage.Width = -1
			newImage.Height = -1
		} else {
			if err := populateImageDimensions(imageReader, &newImage); err != nil {
				return nil, err
			}
		}

		// reset to start
		if _, err = imageReader.Seek(0, 0); err != nil {
			return nil, err
		}

		if err := s.Backend.WriteFile(imageReader, &newImage); err != nil {
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
