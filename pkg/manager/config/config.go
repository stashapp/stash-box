package config

import (
	"errors"
	"time"

	"github.com/spf13/viper"

	"github.com/stashapp/stash-box/pkg/manager/paths"
	"github.com/stashapp/stash-box/pkg/utils"
)

type S3Config struct {
	Endpoint      string            `mapstructure:"endpoint"`
	Bucket        string            `mapstructure:"bucket"`
	AccessKey     string            `mapstructure:"access_key"`
	Secret        string            `mapstructure:"secret"`
	MaxDimension  int64             `mapstructure:"max_dimension"`
	UploadHeaders map[string]string `mapstructure:"upload_headers"`
}

type PostgresConfig struct {
	MaxOpenConns    int `mapstructure:"max_open_conns"`
	MaxIdleConns    int `mapstructure:"max_idle_conns"`
	ConnMaxLifetime int `mapstructure:"conn_max_lifetime"`
}

type OTelConfig struct {
	Endpoint   string  `mapstructure:"endpoint"`
	TraceRatio float64 `mapstructure:"trace_ratio"`
}

type ImageResizeConfig struct {
	Enabled   bool   `mapstructure:"enabled"`
	CachePath string `mapstructure:"cache_path"`
	MinSize   int    `mapstructure:"min_size"`
}

type config struct {
	Host         string `mapstructure:"host"`
	Port         int    `mapstructure:"port"`
	Database     string `mapstructure:"database"`
	ProfilerPort int    `mapstructure:"profiler_port"`

	HTTPUpgrade  bool `mapstructure:"http_upgrade"`
	IsProduction bool `mapstructure:"is_production"`

	// Key used to sign JWT tokens
	JWTSignKey string `mapstructure:"jwt_secret_key"`
	// Key used for session store
	SessionStoreKey string `mapstructure:"session_store_key"`

	// Invite settings
	RequireInvite     bool     `mapstructure:"require_invite"`
	RequireActivation bool     `mapstructure:"require_activation"`
	ActivationExpiry  int      `mapstructure:"activation_expiry"`
	EmailCooldown     int      `mapstructure:"email_cooldown"`
	DefaultUserRoles  []string `mapstructure:"default_user_roles"`

	// URL link for contributor guidelines for submitting edits
	GuidelinesURL string `mapstructure:"guidelines_url"`
	// Number of approved edits before user automatically gets VOTE role
	VotePromotionThreshold int `mapstructure:"vote_promotion_threshold"`
	// Number of positive votes required for immediate approval
	VoteApplicationThreshold int `mapstructure:"vote_application_threshold"`
	// Duration, in seconds, of the voting period
	VotingPeriod int `mapstructure:"voting_period"`
	// Duration, in seconds, of the minimum voting period for destructive edits
	MinDestructiveVotingPeriod int `mapstructure:"min_destructive_voting_period"`
	// Interval between checks for completed voting periods
	VoteCronInterval string `mapstructure:"vote_cron_interval"`
	// Number of times an edit can be updated by the creator
	EditUpdateLimit int `mapstructure:"edit_update_limit"`
	// Require all scene create edits to be submitted via drafts
	RequireSceneDraft bool `mapstructure:"require_scene_draft"`
	// Require the TagRole or Admin to edit tags
	RequireTagRole bool `mapstructure:"require_tag_role"`

	// Email settings
	EmailHost string `mapstructure:"email_host"`
	EmailPort int    `mapstructure:"email_port"`
	EmailUser string `mapstructure:"email_user"`
	EmailPW   string `mapstructure:"email_password"`
	EmailFrom string `mapstructure:"email_from"`
	HostURL   string `mapstructure:"host_url"`

	// Image storage settings
	ImageLocation    string `mapstructure:"image_location"`
	ImageBackend     string `mapstructure:"image_backend"`
	FaviconPath      string `mapstructure:"favicon_path"`
	ImageMaxSize     int    `mapstructure:"image_max_size"`
	ImageJpegQuality int    `mapstructure:"image_jpeg_quality"`

	// Logging options
	LogFile     string `mapstructure:"logFile"`
	UserLogFile string `mapstructure:"userLogFile"`
	LogOut      bool   `mapstructure:"logOut"`
	LogLevel    string `mapstructure:"logLevel"`

	S3 struct {
		S3Config `mapstructure:",squash"`
	}

	Postgres struct {
		PostgresConfig `mapstructure:",squash"`
	}

	OTel struct {
		OTelConfig `mapstructure:",squash"`
	}

	// revive:disable-next-line
	Image_Resizing struct {
		ImageResizeConfig `mapstructure:",squash"`
	}

	PHashDistance int `mapstructure:"phash_distance"`

	Title string `mapstructure:"title"`

	DraftTimeLimit int `mapstructure:"draft_time_limit"`

	CSP string `mapstructure:"csp"`
}

var JWTSignKey = "jwt_secret_key"
var SessionStoreKey = "session_store_key"
var Database = "database"

type ImageBackendType string

const (
	FileBackend ImageBackendType = "file"
	S3Backend   ImageBackendType = "s3"
)

var defaultUserRoles = []string{"READ", "VOTE", "EDIT"}
var C = &config{
	RequireInvite:              true,
	RequireActivation:          false,
	ActivationExpiry:           2 * 60 * 60,
	EmailCooldown:              5 * 60,
	EmailPort:                  25,
	ImageBackend:               string(FileBackend),
	PHashDistance:              0,
	VoteApplicationThreshold:   3,
	VotePromotionThreshold:     10,
	VoteCronInterval:           "5m",
	VotingPeriod:               345600,
	MinDestructiveVotingPeriod: 172800,
	DraftTimeLimit:             86400,
	EditUpdateLimit:            1,
	RequireSceneDraft:          false,
	RequireTagRole:             false,
}

func GetDatabasePath() string {
	return C.Database
}

func GetHost() string {
	return C.Host
}

func GetPort() int {
	return C.Port
}

func GetProfilerPort() *int {
	if C.ProfilerPort == 0 {
		return nil
	}
	return &C.ProfilerPort
}

func GetJWTSignKey() []byte {
	return []byte(C.JWTSignKey)
}

func GetSessionStoreKey() []byte {
	return []byte(C.SessionStoreKey)
}

func GetHTTPUpgrade() bool {
	return C.HTTPUpgrade
}

func GetIsProduction() bool {
	return C.IsProduction
}

// GetRequireInvite returns true if new users cannot register without an invite
// key.
func GetRequireInvite() bool {
	return C.RequireInvite
}

// GetRequireActivation returns true if new users must validate their email address
// via activation to create an account.
func GetRequireActivation() bool {
	return C.RequireActivation
}

// GetActivationExpiry returns the duration before an activation email expires.
func GetActivationExpiry() time.Duration {
	return time.Duration(C.ActivationExpiry * int(time.Second))
}

// GetActivationExpireTime returns the time at which activation emails expire,
// using the current time as the basis.
func GetActivationExpireTime() time.Time {
	expiry := GetActivationExpiry()
	currentTime := time.Now()

	return currentTime.Add(-expiry)
}

// GetEmailCooldown returns the duration before a second activation email may
// be generated.
func GetEmailCooldown() time.Duration {
	return time.Duration(C.EmailCooldown * int(time.Second))
}

// GetDefaultUserRoles returns the default roles assigned to a new user
// when created via registration.
func GetDefaultUserRoles() []string {
	if len(C.DefaultUserRoles) == 0 {
		return defaultUserRoles
	}
	return C.DefaultUserRoles
}

func GetEmailHost() string {
	return C.EmailHost
}

func GetEmailPort() int {
	return C.EmailPort
}

func GetEmailUser() string {
	return C.EmailUser
}

func GetEmailPassword() string {
	return C.EmailPW
}

func GetEmailFrom() string {
	return C.EmailFrom
}

func GetHostURL() string {
	return C.HostURL
}

func GetGuidelinesURL() string {
	return C.GuidelinesURL
}

// GetImageLocation returns the path of where to locally store images.
func GetImageLocation() string {
	return C.ImageLocation
}

// GetImageBackend returns the backend used to store images.
func GetImageBackend() ImageBackendType {
	return ImageBackendType(C.ImageBackend)
}

func GetS3Config() *S3Config {
	return &C.S3.S3Config
}

func GetImageResizeConfig() *ImageResizeConfig {
	return &C.Image_Resizing.ImageResizeConfig
}

func GetOTelConfig() *OTelConfig {
	if C.OTel.Endpoint != "" {
		return &C.OTel.OTelConfig
	}
	return nil
}

// ValidateImageLocation returns an error is image_location is not set.
func ValidateImageLocation() error {
	if C.ImageLocation == "" {
		return errors.New("ImageLocation not set")
	}

	return nil
}

func GetImageMaxSize() *int {
	size := C.ImageMaxSize
	if size == 0 {
		return nil
	}
	return &size
}

func GetImageJpegQuality() int {
	if C.ImageJpegQuality <= 0 || C.ImageJpegQuality > 100 {
		return 75
	}
	return C.ImageJpegQuality
}

// GetLogFile returns the filename of the file to output logs to.
// An empty string means that file logging will be disabled.
func GetLogFile() string {
	return C.LogFile
}

// GetUserLogFile returns the filename of the file to output user operation
// logs to.
// An empty string means that user operation logging will be output to stderr.
func GetUserLogFile() string {
	return C.UserLogFile
}

// GetLogOut returns true if logging should be output to the terminal
// in addition to writing to a log file. Logging will be output to the
// terminal if file logging is disabled. Defaults to true.
func GetLogOut() bool {
	return C.LogOut
}

// GetLogLevel returns the lowest log level to write to the log.
// Should be one of "Debug", "Info", "Warning", "Error"
func GetLogLevel() string {
	const defaultValue = "Info"

	value := C.LogLevel
	if value != "Debug" && value != "Info" && value != "Warning" && value != "Error" {
		value = defaultValue
	}

	return value
}

func GetPHashDistance() int {
	return C.PHashDistance
}

func InitializeDefaults() error {
	// generate some api keys
	const apiKeyLength = 32

	if viper.GetString(JWTSignKey) == "" {
		signKey, err := utils.GenerateRandomKey(apiKeyLength)
		if err != nil {
			return err
		}
		viper.Set(JWTSignKey, signKey)
	}

	if viper.GetString(SessionStoreKey) == "" {
		sessionStoreKey, err := utils.GenerateRandomKey(apiKeyLength)
		if err != nil {
			return err
		}
		viper.Set(SessionStoreKey, sessionStoreKey)
	}

	if viper.GetString(Database) == "" {
		viper.Set(Database, paths.GetDefaultDatabaseFilePath())
	}

	return viper.WriteConfig()
}

// Unmarshal config
func Initialize() error {
	return viper.Unmarshal(&C)
}

func GetMissingEmailSettings() []string {
	if !GetRequireActivation() {
		return nil
	}

	missing := []string{}
	if GetEmailFrom() == "" {
		missing = append(missing, "EmailFrom")
	}
	if GetEmailHost() == "" {
		missing = append(missing, "EmailHost")
	}
	if GetHostURL() == "" {
		missing = append(missing, "HostURL")
	}

	return missing
}

func GetVotePromotionThreshold() *int {
	if C.VotePromotionThreshold == 0 {
		return nil
	}
	return &C.VotePromotionThreshold
}

func GetVoteApplicationThreshold() int {
	return C.VoteApplicationThreshold
}

func GetVotingPeriod() int {
	return C.VotingPeriod
}

func GetMinDestructiveVotingPeriod() int {
	return C.MinDestructiveVotingPeriod
}

func GetVoteCronInterval() string {
	return C.VoteCronInterval
}

func GetEditUpdateLimit() int {
	return C.EditUpdateLimit
}

func GetRequireSceneDraft() bool {
	return C.RequireSceneDraft
}

func GetRequireTagRole() bool {
	return C.RequireTagRole
}

func GetTitle() string {
	if C.Title == "" {
		return "Stash-Box"
	}
	return C.Title
}

func GetFaviconPath() (*string, error) {
	if len(C.FaviconPath) == 0 {
		return nil, errors.New("favicon_path not set")
	}
	return &C.FaviconPath, nil
}

func GetDraftTimeLimit() int {
	return C.DraftTimeLimit
}

func GetMaxOpenConns() int {
	if C.Postgres.MaxOpenConns == 0 {
		return 25
	}
	return C.Postgres.MaxOpenConns
}

func GetMaxIdleConns() int {
	if C.Postgres.MaxIdleConns == 0 {
		return 10
	}
	return C.Postgres.MaxIdleConns
}

func GetConnMaxLifetime() int {
	return C.Postgres.MaxIdleConns
}

func GetCSP() string {
	return C.CSP
}
