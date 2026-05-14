package email

import (
	"errors"
	"fmt"
	"time"

	"github.com/wneessen/go-mail"

	"github.com/stashapp/stash-box/internal/config"
)

type Manager struct {
	lastEmailed map[string]time.Time
}

func NewManager() *Manager {
	return &Manager{
		lastEmailed: make(map[string]time.Time),
	}
}

func (m *Manager) validateEmailCooldown(email string) error {
	m.clearExpired()

	if _, found := m.lastEmailed[email]; found {
		return errors.New("pending-email-change")
	}

	return nil
}

func (m *Manager) clearExpired() {
	cd := config.GetEmailCooldown()
	expireTime := time.Now()
	expireTime = expireTime.Add(-cd)

	for e, t := range m.lastEmailed {
		if t.Before(expireTime) {
			delete(m.lastEmailed, e)
		}
	}
}

func (m *Manager) Send(email, subject, text, html string) error {
	err := m.validateEmailCooldown(email)
	if err != nil {
		return err
	}

	if len(config.GetMissingEmailSettings()) > 0 {
		return errors.New("email settings not configured")
	}

	message := mail.NewMsg()
	if err := message.FromFormat(config.GetTitle(), config.GetEmailFrom()); err != nil {
		return fmt.Errorf("failed to set From address: %w", err)
	}

	if err := message.To(email); err != nil {
		return fmt.Errorf("failed to set To address: %w", err)
	}

	message.Subject(subject)
	message.SetBodyString(mail.TypeTextPlain, text)
	message.AddAlternativeString(mail.TypeTextHTML, html)

	opts := []mail.Option{
		mail.WithPort(config.GetEmailPort()),
	}
	// Only send SMTP AUTH when credentials are configured. Many local relays
	// (and the e2e mock) don't speak AUTH at all; go-mail's default of always
	// asking would fail with "535 Authentication not implemented".
	if user := config.GetEmailUser(); user != "" {
		opts = append(opts,
			mail.WithSMTPAuth(mail.SMTPAuthPlain),
			mail.WithUsername(user),
			mail.WithPassword(config.GetEmailPassword()),
		)
	}
	switch config.GetEmailTLSMode() {
	case "opportunistic":
		opts = append(opts, mail.WithTLSPolicy(mail.TLSOpportunistic))
	case "none":
		opts = append(opts, mail.WithTLSPolicy(mail.NoTLS))
	}
	client, err := mail.NewClient(config.GetEmailHost(), opts...)
	if err != nil {
		return fmt.Errorf("failed to create mail client: %w", err)
	}

	if err := client.DialAndSend(message); err != nil {
		return fmt.Errorf("failed to send mail: %w", err)
	}

	// add to email map
	m.lastEmailed[email] = time.Now()

	return nil
}
