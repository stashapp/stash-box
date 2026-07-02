package storage

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/cookiejar"
	"os"
	"path"
	"strings"
	"sync"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/config"
	"github.com/stashapp/stash-box/internal/models"
	"go.deanishe.net/favicon"
	"golang.org/x/net/publicsuffix"
)

var iconCache = map[uuid.UUID][]byte{}
var iconCacheMutex = &sync.RWMutex{}

func getCachedSiteIcon(site *models.Site) ([]byte, bool) {
	iconCacheMutex.RLock()
	defer iconCacheMutex.RUnlock()

	if cachedIcon, hasIcon := iconCache[site.ID]; hasIcon {
		return cachedIcon, true
	}

	return nil, false
}

// GetSiteIcon returns the stored favicon for a site, or nil if none has been set.
func GetSiteIcon(_ context.Context, site models.Site) ([]byte, error) {
	if cachedIcon, hasIcon := getCachedSiteIcon(&site); hasIcon {
		return cachedIcon, nil
	}

	iconPath, err := siteIconPath(site.ID)
	if err != nil {
		return nil, err
	}

	data, err := os.ReadFile(iconPath)
	if os.IsNotExist(err) {
		return nil, nil
	}
	if err != nil || len(data) == 0 {
		return nil, err
	}

	iconCacheMutex.Lock()
	defer iconCacheMutex.Unlock()

	iconCache[site.ID] = data
	return data, nil
}

// SetSiteIcon stores the favicon for a site from a base64 data URL (or raw base64).
func SetSiteIcon(siteID uuid.UUID, dataURL string) error {
	data, err := decodeDataURL(dataURL)
	if err != nil {
		return err
	}

	iconPath, err := siteIconPath(siteID)
	if err != nil {
		return err
	}

	if err := os.WriteFile(iconPath, data, 0644); err != nil {
		return err
	}

	iconCacheMutex.Lock()
	defer iconCacheMutex.Unlock()
	iconCache[siteID] = data

	return nil
}

// ClearSiteIcon removes any stored favicon for a site. It is a no-op when no
// favicon path is configured, since there is nothing on disk to remove.
func ClearSiteIcon(siteID uuid.UUID) error {
	iconCacheMutex.Lock()
	delete(iconCache, siteID)
	iconCacheMutex.Unlock()

	faviconPath, _ := config.GetFaviconPath()
	if faviconPath == nil {
		return nil
	}

	iconPath := path.Join(*faviconPath, siteID.String())
	if err := os.Remove(iconPath); err != nil && !os.IsNotExist(err) {
		return err
	}

	return nil
}

func siteIconPath(siteID uuid.UUID) (string, error) {
	faviconPath, err := config.GetFaviconPath()
	if faviconPath == nil {
		return "", err
	}
	return path.Join(*faviconPath, siteID.String()), nil
}

func decodeDataURL(dataURL string) ([]byte, error) {
	if dataURL == "" {
		return nil, errors.New("empty favicon data")
	}
	// Strip an optional data URL prefix (e.g. "data:image/png;base64,").
	if idx := strings.Index(dataURL, ";base64,"); idx != -1 {
		dataURL = dataURL[idx+len(";base64,"):]
	}
	return base64.StdEncoding.DecodeString(dataURL)
}

// FetchSiteFavicons discovers favicon candidates for a URL (favicon.ico plus
// icon/apple-touch-icon link tags from the page) and returns each downloaded
// icon as a base64 data URL, avoiding CORS restrictions on the frontend.
func FetchSiteFavicons(ctx context.Context, siteURL string) ([]models.SiteFavicon, error) {
	if siteURL == "" {
		return nil, errors.New("no site url given")
	}

	// A cookiejar is needed because some sites return a redirect with a cookie
	// that must be included in the subsequent request to avoid a redirect loop.
	jar, err := cookiejar.New(&cookiejar.Options{PublicSuffixList: publicsuffix.List})
	if err != nil {
		return nil, err
	}

	client := &http.Client{Jar: jar}
	finder := favicon.New(favicon.WithClient(client))
	icons, err := finder.Find(siteURL)
	if err != nil {
		return nil, err
	}

	favicons := make([]models.SiteFavicon, 0, len(icons))
	for _, icon := range icons {
		dataURL, err := downloadDataURL(ctx, client, icon.URL, icon.MimeType)
		if err != nil {
			// Skip candidates that fail to download.
			continue
		}
		favicons = append(favicons, models.SiteFavicon{
			URL:   icon.URL,
			Image: dataURL,
		})
	}

	return favicons, nil
}

func downloadDataURL(ctx context.Context, client *http.Client, url string, mimeType string) (string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return "", err
	}

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode > 299 {
		return "", fmt.Errorf("[%d] %s", resp.StatusCode, url)
	}

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	if len(data) == 0 {
		return "", errors.New("empty icon")
	}

	if ct := resp.Header.Get("Content-Type"); ct != "" {
		mimeType = ct
	}
	if mimeType == "" {
		mimeType = http.DetectContentType(data)
	}

	return fmt.Sprintf("data:%s;base64,%s", mimeType, base64.StdEncoding.EncodeToString(data)), nil
}
