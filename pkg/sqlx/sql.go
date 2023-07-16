package sqlx

import (
	"database/sql"
	"fmt"
	"reflect"
	"strings"
	"time"

	"github.com/gofrs/uuid"
)

type queryBuilder struct {
	Table table
	Body  string

	whereClauses  []string
	havingClauses []string
	args          []interface{}

	Sort       string
	Pagination string
}

func newQueryBuilder(t table) *queryBuilder {
	ret := &queryBuilder{
		Table: t,
	}

	tableName := t.Name()
	ret.Body = "SELECT " + tableName + ".* FROM " + tableName + " "

	return ret
}

func newDeleteQueryBuilder(t table) *queryBuilder {
	ret := &queryBuilder{
		Table: t,
	}

	tableName := t.Name()
	ret.Body = "DELETE FROM " + tableName + " "

	return ret
}

func (qb *queryBuilder) AddJoin(jt table, on string) {
	qb.Body += " JOIN " + jt.Name() + " ON " + on
}

func (qb *queryBuilder) AddJoinTableFilter(tj tableJoin, query string, having *string, not bool, args ...interface{}) {
	clause := fmt.Sprintf(" JOIN (SELECT %[1]s.%[2]s FROM %[1]s WHERE %[3]s", tj.Name(), tj.joinColumn, query)
	if len(args) > 1 {
		clause += fmt.Sprintf(" GROUP BY %s.%s", tj.Name(), tj.joinColumn)

		if having != nil {
			clause += fmt.Sprintf(" HAVING %s", *having)
		}
	}

	clause += fmt.Sprintf(") %[1]s ON %[3]s.id = %[1]s.%[2]s", tj.Name(), tj.joinColumn, tj.primaryTable)

	if not {
		clause = " LEFT" + clause
		qb.AddWhere(fmt.Sprintf("%s.%s IS NULL", tj.Name(), tj.joinColumn))
	}

	qb.Body += clause
	qb.AddArg(args...)
}

func (qb *queryBuilder) AddWhere(clauses ...string) {
	qb.whereClauses = append(qb.whereClauses, clauses...)
}

func (qb *queryBuilder) Eq(column string, arg interface{}) {
	qb.AddWhere(column + " = ?")
	qb.AddArg(arg)
}

func (qb *queryBuilder) NotEq(column string, arg interface{}) {
	qb.AddWhere(column + " != ?")
	qb.AddArg(arg)
}

func (qb *queryBuilder) IsNull(column string) {
	qb.AddWhere(column + " is NULL")
}

func (qb *queryBuilder) IsNotNull(column string) {
	qb.AddWhere(column + " is not NULL")
}

func (qb *queryBuilder) AddHaving(clauses ...string) {
	if len(clauses) == 1 && clauses[0] == "" {
		return
	}
	qb.havingClauses = append(qb.havingClauses, clauses...)
}

func (qb *queryBuilder) AddArg(args ...interface{}) {
	qb.args = append(qb.args, args...)
}

func (qb queryBuilder) buildBody(isCount bool) string {
	body := qb.Body

	if len(qb.whereClauses) > 0 {
		body = body + " WHERE " + strings.Join(qb.whereClauses, " AND ") // TODO handle AND or OR
	}
	if len(qb.havingClauses) > 0 {
		body = body + " GROUP BY " + qb.Table.Name() + ".id HAVING " + strings.Join(qb.havingClauses, " AND ") // TODO handle AND or OR
	}

	if !isCount {
		body += qb.Sort
	}

	return body
}

func (qb queryBuilder) buildCountQuery() string {
	return "SELECT COUNT(*) as count FROM (" + qb.buildBody(true) + ") as temp"
}

func (qb queryBuilder) buildQuery() string {
	return qb.buildBody(false) + qb.Pagination
}

type optionalValue interface {
	IsValid() bool
}

func ensureTx(txn *txnState) {
	if !txn.InTxn() {
		panic("must use a transaction")
	}
}

func getByID(txn *txnState, t string, id uuid.UUID, object interface{}) error {
	query := txn.DB().Rebind(`SELECT * FROM ` + t + ` WHERE id = ? LIMIT 1`)
	return txn.DB().Get(object, query, id)
}

func insertObject(txn *txnState, t string, object interface{}, conflictHandling *string) error {
	ensureTx(txn)
	fields, values := sqlGenKeysCreate(object)

	conflictClause := ""
	if conflictHandling != nil {
		conflictClause = *conflictHandling
	}

	_, err := txn.DB().NamedExec(
		`INSERT INTO `+t+` (`+fields+`)
				VALUES (`+values+`)
                `+conflictClause+`
		`,
		object,
	)

	return err
}

func updateObjectByID(txn *txnState, t string, object interface{}, updateEmptyValues bool) error {
	ensureTx(txn)
	_, err := txn.DB().NamedExec(
		`UPDATE `+t+` SET `+sqlGenKeys(object, updateEmptyValues)+` WHERE `+t+`.id = :id`,
		object,
	)

	return err
}

func executeDeleteQuery(tableName string, id uuid.UUID, txn *txnState) error {
	ensureTx(txn)
	idColumnName := getColumn(tableName, "id")
	query := txn.DB().Rebind(`DELETE FROM ` + tableName + ` WHERE ` + idColumnName + ` = ?`)
	_, err := txn.DB().Exec(query, id)
	return err
}

func softDeleteObjectByID(txn *txnState, t string, id uuid.UUID) error {
	ensureTx(txn)
	idColumnName := getColumn(t, "id")
	query := txn.DB().Rebind(`UPDATE ` + t + ` SET deleted=TRUE WHERE ` + idColumnName + ` = ?`)
	_, err := txn.DB().Exec(query, id)
	return err
}

func deleteObjectsByColumn(txn *txnState, t string, column string, value interface{}) error {
	ensureTx(txn)
	query := txn.DB().Rebind(`DELETE FROM ` + t + ` WHERE ` + column + ` = ?`)
	_, err := txn.DB().Exec(query, value)
	return err
}

func getColumn(tableName string, columnName string) string {
	return tableName + "." + columnName
}

func sqlGenKeysCreate(i interface{}) (string, string) {
	var fields []string
	var values []string

	addPlaceholder := func(key string) {
		fields = append(fields, fieldQuote(key))
		values = append(values, ":"+key)
	}

	v := reflect.ValueOf(i)
	for i := 0; i < v.NumField(); i++ {
		// get key for struct tag
		rawKey := v.Type().Field(i).Tag.Get("db")
		key := strings.Split(rawKey, ",")[0]
		switch t := v.Field(i).Interface().(type) {
		case string:
			if t != "" {
				addPlaceholder(key)
			}
		case int, int64, float64:
			if t != 0 {
				addPlaceholder(key)
			}
		case uuid.UUID:
			if t != uuid.Nil {
				addPlaceholder(key)
			}
		case bool:
			addPlaceholder(key)
		case time.Time:
			if !t.IsZero() {
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
		case uuid.NullUUID:
			if t.Valid {
				addPlaceholder(key)
			}
		case sql.NullFloat64:
			if t.Valid {
				addPlaceholder(key)
			}
		case sql.NullTime:
			if t.Valid {
				addPlaceholder(key)
			}
		default:
			reflectValue := reflect.ValueOf(t)
			isNil := reflectValue.IsNil()
			if !isNil {
				addPlaceholder(key)
			}
		}
	}
	return strings.Join(fields, ", "), strings.Join(values, ", ")
}

func sqlGenKeys(i interface{}, partial bool) string {
	var query []string

	addKey := func(key string) {
		query = append(query, fmt.Sprintf("%s=:%s", fieldQuote(key), key))
	}

	v := reflect.ValueOf(i)
	for i := 0; i < v.NumField(); i++ {
		// get key for struct tag
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
		case uuid.UUID:
			if partial || t != uuid.Nil {
				addKey(key)
			}
		case int, int64, float64:
			if partial || t != 0 {
				addKey(key)
			}
		case bool:
			addKey(key)
		case time.Time:
			if !t.IsZero() {
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
		case uuid.NullUUID:
			if partial || t.Valid {
				addKey(key)
			}
		case sql.NullFloat64:
			if partial || t.Valid {
				addKey(key)
			}
		case sql.NullTime:
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

func fieldQuote(field string) string {
	return `"` + field + `"`
}

func nullsLast() string {
	return " NULLS LAST "
}
