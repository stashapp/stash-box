package api

import (
	"errors"
	"net/http"

	"github.com/stashapp/stash-box/internal/service"
	"github.com/stashapp/stash-box/internal/service/user"
	"github.com/stashapp/stash-box/internal/config"

	"github.com/gorilla/sessions"
)

const cookieName = "stashbox"
const usernameFormKey = "username"
const passwordFormKey = "password"
const userIDKey = "userID"
const maxCookieAge = 60 * 60 * 24 * 30 // 1 month

var sessionStore *sessions.CookieStore

func InitializeSession() {
	sessionStore = sessions.NewCookieStore(config.GetSessionStoreKey())
}

func handleLogin(fac service.Factory) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		newSession, err := sessionStore.Get(r, cookieName)

		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		username := r.FormValue(usernameFormKey)
		password := r.FormValue(passwordFormKey)

		// authenticate the user
		userID, err := fac.User().Authenticate(r.Context(), username, password)

		if errors.Is(err, user.ErrAccessDenied) {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		} else if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		newSession.Values[userIDKey] = userID
		newSession.Options.MaxAge = maxCookieAge
		newSession.Options.HttpOnly = true
		if config.GetIsProduction() {
			newSession.Options.Secure = true
		} else {
			newSession.Options.Secure = false
			newSession.Options.SameSite = http.SameSiteLaxMode
		}

		err = newSession.Save(r, w)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}
}

func handleLogout(w http.ResponseWriter, r *http.Request) {
	session, err := sessionStore.Get(r, cookieName)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	delete(session.Values, userIDKey)
	session.Options.MaxAge = -1

	err = session.Save(r, w)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func getSessionUserID(w http.ResponseWriter, r *http.Request) (string, error) {
	session, err := sessionStore.Get(r, cookieName)
	if err != nil {
		session.Options.MaxAge = -1
		if err = session.Save(r, w); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return "", nil
	}

	if !session.IsNew {
		userIDInt := session.Values[userIDKey]
		userID, _ := userIDInt.(string)

		// refresh the cookie
		err = session.Save(r, w)
		if err != nil {
			return "", err
		}

		return userID, nil
	}

	return "", nil
}
