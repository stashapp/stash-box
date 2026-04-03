package autocert

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"encoding/pem"
	"net/http"
	"time"

	"golang.org/x/crypto/acme/autocert"

	"github.com/stashapp/stash-box/internal/config"
	"github.com/stashapp/stash-box/pkg/logger"
)

var manager *autocert.Manager
var domain string

// Init initializes autocert if configured and returns the TLS config.
// Returns nil if autocert is not enabled.
func Init() *tls.Config {
	cfg := config.GetAutocertConfig()
	if cfg == nil {
		return nil
	}

	cache := autocert.DirCache(cfg.CacheDir)
	domain = cfg.Domain

	manager = &autocert.Manager{
		Prompt:     autocert.AcceptTOS,
		HostPolicy: autocert.HostWhitelist(domain),
		Cache:      cache,
		Email:      cfg.Email,
	}

	// Obtain certificate on startup
	go checkAndRenew()

	tlsConfig := manager.TLSConfig()
	tlsConfig.MinVersion = tls.VersionTLS12

	return tlsConfig
}

// HTTPHandler returns the autocert HTTP handler for ACME challenges.
// The fallback handler is used for non-ACME requests.
func HTTPHandler(fallback http.Handler) http.Handler {
	if manager == nil {
		return fallback
	}
	return manager.HTTPHandler(fallback)
}

// CheckAndRenew checks the certificate and renews if needed.
// Called by cron job.
func CheckAndRenew() {
	if manager == nil {
		return
	}
	checkAndRenew()
}

func checkAndRenew() {
	// Check cache first
	if data, err := manager.Cache.Get(context.Background(), domain); err == nil {
		if block, _ := pem.Decode(data); block != nil {
			if cert, err := x509.ParseCertificate(block.Bytes); err == nil {
				now := time.Now()
				daysUntilExpiry := int(cert.NotAfter.Sub(now).Hours() / 24)

				switch {
				case now.After(cert.NotAfter):
					logger.Warnf("Autocert: certificate for %s has expired, renewing...", domain)
				case daysUntilExpiry <= 30:
					logger.Infof("Autocert: certificate for %s expires in %d days, renewing...", domain, daysUntilExpiry)
				default:
					return
				}
			}
		}
	} else {
		logger.Infof("Autocert: obtaining certificate for %s from Let's Encrypt...", domain)
	}

	// Trigger certificate acquisition/renewal
	hello := &tls.ClientHelloInfo{ServerName: domain}
	cert, err := manager.GetCertificate(hello)
	if err != nil {
		logger.Errorf("Autocert: failed to obtain certificate for %s: %v", domain, err)
		return
	}

	if cert != nil && len(cert.Certificate) > 0 {
		if x509Cert, parseErr := x509.ParseCertificate(cert.Certificate[0]); parseErr == nil {
			daysUntilExpiry := int(time.Until(x509Cert.NotAfter).Hours() / 24)
			logger.Infof("Autocert: obtained certificate for %s (expires %s, %d days remaining)", domain, x509Cert.NotAfter.Format("2006-01-02"), daysUntilExpiry)
		}
	}
}
