package email

import (
	"errors"
	"net/smtp"
	"strconv"
	"time"

	"github.com/stashapp/stash-box/pkg/manager/config"
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
		return errors.New("try again later")
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

func (m *Manager) makeAuth() smtp.Auth {
	if config.GetEmailUser() != "" {
		return smtp.PlainAuth("", config.GetEmailUser(), config.GetEmailPassword(), config.GetEmailHost())
	}

	return nil
}

func (m *Manager) Send(email, subject, body string) error {
	err := m.validateEmailCooldown(email)
	if err != nil {
		return err
	}

	if len(config.GetMissingEmailSettings()) > 0 {
		return errors.New("email settings not configured")
	}

	const endLine = "\r\n"
	from := "From: " + config.GetEmailFrom()
	to := "To: " + email
	port := strconv.Itoa(config.GetEmailPort())

	msg := []byte(from + endLine + to + endLine + subject + endLine + endLine + body + endLine)

	err = smtp.SendMail(config.GetEmailHost()+":"+port, m.makeAuth(), config.GetEmailFrom(), []string{email}, msg)

	if err != nil {
		return err
	}

	// add to email map
	m.lastEmailed[email] = time.Now()

	return nil
}
