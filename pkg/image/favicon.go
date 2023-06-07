package image

import (
	"context"
	"io"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"os"
	"path"
	"sync"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/manager/config"
	"github.com/stashapp/stash-box/pkg/models"
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
	if siteURL == "" {
		return
	}

	u, err := url.Parse(siteURL)
	if err != nil {
		return
	}

	// We need a client with a cookiejar for the favicon finder because some websites
	// simply don't work without cookies.
	// For instance, at the time of writing, twitter.com at the time of writing returns an
	// http 302 redirect with location `/` and a `guest_id` cookie. We must include this cookie
	// in the subsequent request otherwise we are stuck in a redirect loop.
	jar, err := cookiejar.New(&cookiejar.Options{PublicSuffixList: publicsuffix.List})
	if err != nil {
		return
	}

	c := &http.Client{Jar: jar}
	finder := favicon.New(favicon.WithClient(c))
	icons, err := finder.Find(u.Scheme + "://" + u.Host)
	if err != nil || len(icons) < 1 {
		return
	}

	// Icons are sorted widest first. Based on the design of the stash-box UI,
	// it makes sense to grab the _smallest_ icon, i.e. the last one.
	// TODO: Find the ideal size favicon for the stash-box UI and try to get the same here.
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, icons[len(icons)-1].URL, nil)
	if err != nil {
		return
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return
	}
	defer resp.Body.Close()

	out, err := os.Create(iconPath)
	if err != nil {
		return
	}
	defer out.Close()

	//nolint
	io.Copy(out, resp.Body)
}
