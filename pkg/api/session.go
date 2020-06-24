package api

import (
	"net/http"

	"github.com/stashapp/stashdb/pkg/manager"
	"github.com/stashapp/stashdb/pkg/manager/config"

	"github.com/gorilla/sessions"
)

const cookieName = "session"
const usernameFormKey = "username"
const passwordFormKey = "password"
const userIDKey = "userID"
const maxCookieAge = 60 * 60 * 1 // 1 hours

var sessionStore = sessions.NewCookieStore(config.GetSessionStoreKey())

func handleLogin(w http.ResponseWriter, r *http.Request) {
	newSession, err := sessionStore.Get(r, cookieName)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	username := r.FormValue("username")
	password := r.FormValue("password")

	// authenticate the user
	userID, err := manager.Authenticate(username, password)

	if err == manager.ErrAccessDenied {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	} else if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	newSession.Values[userIDKey] = userID
	newSession.Options.MaxAge = maxCookieAge

	err = newSession.Save(r, w)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
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
		return "", err
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
