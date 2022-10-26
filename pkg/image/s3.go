package image

import (
	"bytes"
	"context"
	"io"
	"net/http"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"github.com/stashapp/stash-box/pkg/manager/config"
	"github.com/stashapp/stash-box/pkg/models"
)

type S3Backend struct{}

func (s *S3Backend) WriteFile(file *bytes.Reader, image *models.Image) error {
	s3config := config.GetS3Config()
	minioClient, err := minio.New(s3config.Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(s3config.AccessKey, s3config.Secret, ""),
		Secure: true,
	})

	if err != nil {
		return err
	}

	imagePath := GetImageFileNameFromUUID(image.ID)

	// need to extract the first 512 bytes for content type detection
	buf := bytes.NewBuffer(make([]byte, 512))
	if _, err := io.CopyN(buf, file, 512); err != nil {
		return err
	}

	contentType := http.DetectContentType(buf.Bytes())

	// reset to start
	if _, err := file.Seek(0, 0); err != nil {
		return err
	}

	_, err = minioClient.PutObject(
		context.TODO(),
		s3config.Bucket,
		imagePath,
		file,
		int64(file.Len()),
		minio.PutObjectOptions{
			ContentType: contentType,
		},
	)

	return err
}

func (s *S3Backend) DestroyFile(image *models.Image) error {
	s3config := config.GetS3Config()
	minioClient, err := minio.New(s3config.Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(s3config.AccessKey, s3config.Secret, ""),
		Secure: true,
	})

	if err != nil {
		return err
	}

	imagePath := GetImageFileNameFromUUID(image.ID)
	err = minioClient.RemoveObject(context.TODO(), s3config.Bucket, imagePath, minio.RemoveObjectOptions{})

	return err
}
