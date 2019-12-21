package api

import (
    "bytes"
	"context"
    "database/sql"
    "fmt"
	"github.com/gofrs/uuid"
    "net/http"
	"time"
    "image"
    _ "image/jpeg"
    _ "image/png"
    _ "golang.org/x/image/webp"
    "github.com/aws/aws-sdk-go/aws"
    "github.com/aws/aws-sdk-go/aws/session"
    "github.com/aws/aws-sdk-go/service/s3/s3manager"

	"github.com/stashapp/stashdb/pkg/database"
	"github.com/stashapp/stashdb/pkg/models"
)

func (r *mutationResolver) StudioCreate(ctx context.Context, input models.StudioCreateInput) (*models.Studio, error) {
	if err := validateModify(ctx); err != nil {
		return nil, err
	}

	var err error

	if err != nil {
		return nil, err
	}

	UUID, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}

	// Populate a new studio from the input
	currentTime := time.Now()
	newStudio := models.Studio{
		ID:        UUID,
		CreatedAt: models.SQLiteTimestamp{Timestamp: currentTime},
		UpdatedAt: models.SQLiteTimestamp{Timestamp: currentTime},
	}

	newStudio.CopyFromCreateInput(input)

	// Start the transaction and save the studio
	tx := database.DB.MustBeginTx(ctx, nil)
	qb := models.NewStudioQueryBuilder(tx)
	studio, err := qb.Create(newStudio)
	if err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// TODO - save child studios

	// Save the URLs
	studioUrls := models.CreateStudioUrls(studio.ID, input.Urls)
	if err := qb.CreateUrls(studioUrls); err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// Commit
	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return studio, nil
}

func (r *mutationResolver) StudioUpdate(ctx context.Context, input models.StudioUpdateInput) (*models.Studio, error) {
	if err := validateModify(ctx); err != nil {
		return nil, err
	}

	tx := database.DB.MustBeginTx(ctx, nil)
	qb := models.NewStudioQueryBuilder(tx)

	// get the existing studio and modify it
	studioID, _ := uuid.FromString(input.ID)
	updatedStudio, err := qb.Find(studioID)

	if err != nil {
		return nil, err
	}

	updatedStudio.UpdatedAt = models.SQLiteTimestamp{Timestamp: time.Now()}

	// Populate studio from the input
	updatedStudio.CopyFromUpdateInput(input)

	studio, err := qb.Update(*updatedStudio)
	if err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// Save the URLs
	// TODO - only do this if provided
	studioUrls := models.CreateStudioUrls(studio.ID, input.Urls)
    // if photo, download image, check mimetype, compress if webp or too large
    for _, url := range studioUrls {
        if url.Type == "PHOTO" {
            resp, err := http.Get(url.URL)
            if err != nil {
                return nil, err
            }

            buf := new(bytes.Buffer)
            buf.ReadFrom(resp.Body)
            defer resp.Body.Close()

            width := 1
            height := 1
            mimetype := http.DetectContentType([]byte(buf.String()))
            namespace, err := uuid.FromString("415b2d34-a24d-4de6-9416-a304bd42be4d")
            imageID := uuid.NewV3(namespace, buf.String())
            if mimetype == "image/jpeg" || mimetype == "image/png" ||  mimetype == "image/webp" {
                tempBuffer := bytes.NewBuffer(buf.Bytes())
                img, _, err := image.DecodeConfig(tempBuffer)
                width = img.Width
                height = img.Height

                if err != nil {
                    return nil, err
                }
            } else if mimetype == "text/xml; charset=utf-8" {
                mimetype = "image/svg+xml"
            } else if mimetype != "image/svg+xml" {
                return nil, fmt.Errorf("Unsupported image type: %s", mimetype)
            }

            if err != nil {
                return nil, err
            }

            sess, err := session.NewSession(&aws.Config{
                Endpoint:      aws.String("https://ams3.digitaloceanspaces.com"),
                Region: aws.String("us-west-2"),
            })

            idString := imageID.String();
            fmt.Println(string(idString[0:2]) + "/" + string(idString[2:4]) + "/" + idString)

            uploader := s3manager.NewUploader(sess)
            _, err = uploader.Upload(&s3manager.UploadInput{
                Bucket: aws.String("cdn-stashdb"),
                Key: aws.String(string(idString[0:2]) + "/" + string(idString[2:4]) + "/" + idString),
                Body: bytes.NewReader(buf.Bytes()),
                ContentType: aws.String(mimetype),
                ACL: aws.String("public-read"),
            })
            if err != nil {
                return nil, err
            }

            url.ImageID = uuid.NullUUID{UUID: imageID, Valid: true}
            url.Width = sql.NullInt32{Int32: int32(width), Valid: true}
            url.Height = sql.NullInt32{Int32: int32(height), Valid: true}
        }
    }
	if err := qb.UpdateUrls(studio.ID, studioUrls); err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// TODO - handle child studios

	// Commit
	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return studio, nil
}

func (r *mutationResolver) StudioDestroy(ctx context.Context, input models.StudioDestroyInput) (bool, error) {
	if err := validateModify(ctx); err != nil {
		return false, err
	}

	tx := database.DB.MustBeginTx(ctx, nil)
	qb := models.NewStudioQueryBuilder(tx)

	// references have on delete cascade, so shouldn't be necessary
	// to remove them explicitly

	studioID, err := uuid.FromString(input.ID)
	if err != nil {
		return false, err
	}
	if err = qb.Destroy(studioID); err != nil {
		_ = tx.Rollback()
		return false, err
	}

	if err := tx.Commit(); err != nil {
		return false, err
	}
	return true, nil
}
