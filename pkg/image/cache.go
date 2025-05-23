package image

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sync"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/logger"
	"github.com/stashapp/stash-box/pkg/manager/config"
)

// CacheManager handles caching of resized images
type cacheManager struct {
	path string
}

var (
	instance *cacheManager
	once     sync.Once
)

func GetCacheManager() *cacheManager {
	once.Do(func() {
		resizeConfig := config.GetImageResizeConfig()
		if resizeConfig == nil || !resizeConfig.Enabled || len(resizeConfig.CachePath) == 0 {
			logger.Debugf("image cache not enabled")
			return
		}

		if err := os.MkdirAll(resizeConfig.CachePath, 0755); err != nil {
			logger.Errorf("Failed to initialize cache directory: %v", err)
			return
		}

		logger.Debugf("image cache enabled in: %s", resizeConfig.CachePath)

		instance = &cacheManager{}
		instance.path = resizeConfig.CachePath
	})
	return instance
}

func (c *cacheManager) getItemPath(id uuid.UUID, size int) string {
	filename := fmt.Sprintf("%s_%d", id.String(), size)
	return filepath.Join(c.path, filename)
}

func (c *cacheManager) Read(id uuid.UUID, size int) (io.ReadCloser, error) {
	filePath := c.getItemPath(id, size)
	logger.Debugf("reading cached image: %s", filePath)
	return os.Open(filePath)
}

func (c *cacheManager) Write(id uuid.UUID, size int, data []byte) error {
	filePath := c.getItemPath(id, size)
	logger.Debugf("writing cached image: %s", filePath)
	return os.WriteFile(filePath, data, 0644)
}

func (c *cacheManager) Delete(id uuid.UUID) error {
	globPath := filepath.Join(c.path, fmt.Sprintf("%s_*", id.String()))
	files, err := filepath.Glob(globPath)
	if err != nil {
		return err
	}

	for _, f := range files {
		if err := os.Remove(f); err != nil {
			return err
		}
		logger.Debugf("deleted cached image: %s", f)
	}

	return nil
}
