package image

import (
	"context"
	"io"
	"net/http"
	"net/url"
	"os"
	"path"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/manager/config"
	"github.com/stashapp/stash-box/pkg/models"
)

var iconCache = map[uuid.UUID][]byte{}

func GetSiteIcon(ctx context.Context, site models.Site) []byte {
	if cachedIcon, hasIcon := iconCache[site.ID]; hasIcon {
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
	u.Path = path.Join(u.Path, "favicon.ico")

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), nil)
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
