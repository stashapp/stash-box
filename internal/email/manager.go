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

	client, err := mail.NewClient(config.GetEmailHost(), mail.WithPort(config.GetEmailPort()), mail.WithSMTPAuth(mail.SMTPAuthPlain),
		mail.WithUsername(config.GetEmailUser()), mail.WithPassword(config.GetEmailPassword()))
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
