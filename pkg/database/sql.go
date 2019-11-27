package database

import (
	"database/sql"
	"fmt"
	"reflect"
	"strings"

	"github.com/jmoiron/sqlx"
)

type optionalValue interface {
	IsValid() bool
}

func ensureTx(tx *sqlx.Tx) {
	if tx == nil {
		panic("must use a transaction")
	}
}

func getByID(tx *sqlx.Tx, table string, id int64, object interface{}) error {
	return tx.Get(object, `SELECT * FROM `+table+` WHERE id = ? LIMIT 1`, id)
}

func insertObject(tx *sqlx.Tx, table string, object interface{}) (int64, error) {
	ensureTx(tx)
	fields, values := sqlGenKeysCreate(object)

	result, err := tx.NamedExec(
		`INSERT INTO `+table+` (`+fields+`)
				VALUES (`+values+`)
		`,
		object,
	)

	if err != nil {
		return 0, err
	}

	return result.LastInsertId()
}

func updateObjectByID(tx *sqlx.Tx, table string, object interface{}) error {
	ensureTx(tx)
	_, err := tx.NamedExec(
		`UPDATE `+table+` SET `+sqlGenKeys(object, false)+` WHERE `+table+`.id = :id`,
		object,
	)

	return err
}

func executeDeleteQuery(tableName string, id int64, tx *sqlx.Tx) error {
	if tx == nil {
		panic("must use a transaction")
	}
	idColumnName := getColumn(tableName, "id")
	_, err := tx.Exec(
		`DELETE FROM `+tableName+` WHERE `+idColumnName+` = ?`,
		id,
	)
	return err
}

func deleteObjectsByColumn(tx *sqlx.Tx, table string, column string, value interface{}) error {
	ensureTx(tx)
	_, err := tx.Exec(`DELETE FROM `+table+` WHERE `+column+` = ?`, value)
	return err
}

func getColumn(tableName string, columnName string) string {
	return tableName + "." + columnName
}

func sqlGenKeysCreate(i interface{}) (string, string) {
	var fields []string
	var values []string

	addPlaceholder := func(key string) {
		fields = append(fields, "`"+key+"`")
		values = append(values, ":"+key)
	}

	v := reflect.ValueOf(i)
	for i := 0; i < v.NumField(); i++ {
		//get key for struct tag
		rawKey := v.Type().Field(i).Tag.Get("db")
		key := strings.Split(rawKey, ",")[0]
		if key == "id" {
			continue
		}
		switch t := v.Field(i).Interface().(type) {
		case string:
			if t != "" {
				addPlaceholder(key)
			}
		case int, int64, float64:
			if t != 0 {
				addPlaceholder(key)
			}
		case optionalValue:
			if t.IsValid() {
				addPlaceholder(key)
			}
		case sql.NullString:
			if t.Valid {
				addPlaceholder(key)
			}
		case sql.NullBool:
			if t.Valid {
				addPlaceholder(key)
			}
		case sql.NullInt64:
			if t.Valid {
				addPlaceholder(key)
			}
		case sql.NullFloat64:
			if t.Valid {
				addPlaceholder(key)
			}
		default:
			reflectValue := reflect.ValueOf(t)
			isNil := reflectValue.IsNil()
			if !isNil {
				fields = append(fields, key)
				values = append(values, ":"+key)
			}
		}
	}
	return strings.Join(fields, ", "), strings.Join(values, ", ")
}

func sqlGenKeys(i interface{}, partial bool) string {
	var query []string

	addKey := func(key string) {
		query = append(query, fmt.Sprintf("%s=:%s", key, key))
	}

	v := reflect.ValueOf(i)
	for i := 0; i < v.NumField(); i++ {
		//get key for struct tag
		rawKey := v.Type().Field(i).Tag.Get("db")
		key := strings.Split(rawKey, ",")[0]
		if key == "id" {
			continue
		}
		switch t := v.Field(i).Interface().(type) {
		case string:
			if partial || t != "" {
				addKey(key)
			}
		case int, int64, float64:
			if partial || t != 0 {
				addKey(key)
			}
		case optionalValue:
			if partial || t.IsValid() {
				addKey(key)
			}
		case sql.NullString:
			if partial || t.Valid {
				addKey(key)
			}
		case sql.NullBool:
			if partial || t.Valid {
				addKey(key)
			}
		case sql.NullInt64:
			if partial || t.Valid {
				addKey(key)
			}
		case sql.NullFloat64:
			if partial || t.Valid {
				addKey(key)
			}
		default:
			reflectValue := reflect.ValueOf(t)
			isNil := reflectValue.IsNil()
			if !isNil {
				addKey(key)
			}
		}
	}
	return strings.Join(query, ", ")
}
