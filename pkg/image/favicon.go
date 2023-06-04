package image

import (
	"context"
	"io"
	"net/http"
	"net/url"
	"os"
	"path"
	"sync"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/manager/config"
	"github.com/stashapp/stash-box/pkg/models"
	"go.deanishe.net/favicon"
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

func GetSiteIcon(ctx context.Context, site models.Site) []byte {
	if cachedIcon, hasIcon := getCachedSiteIcon(&site); hasIcon {
		return cachedIcon
	}

	faviconPath := config.GetFaviconPath()
	if faviconPath == nil {
		return nil
	}
	iconPath := path.Join(*faviconPath, site.ID.String())

	if _, err := os.Stat(iconPath); os.IsNotExist(err) {
		downloadIcon(ctx, iconPath, site.URL.String)
	}

	data, err := os.ReadFile(iconPath)
	if err != nil || len(data) == 0 {
		return nil
	}

	iconCacheMutex.Lock()
	defer iconCacheMutex.Unlock()

	iconCache[site.ID] = data
	return iconCache[site.ID]
}

func downloadIcon(ctx context.Context, iconPath string, siteURL string) {
	out, err := os.Create(iconPath)
	if err != nil {
		return
	}
	defer out.Close()

	if siteURL == "" {
		return
	}

	u, err := url.Parse(siteURL)
	if err != nil {
		return
	}

	icons, err := favicon.Find(u.Scheme + "://" + u.Host)
	if err != nil || len(icons) < 1 {
		return
	}

	// Icons are sorted widest first. We currently get the first one (icons[0]).
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, icons[0].URL, nil)
	if err != nil {
		return
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return
	}
	defer resp.Body.Close()

	//nolint
	io.Copy(out, resp.Body)
}
