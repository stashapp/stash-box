// nolint: revive
package utils

import (
	"context"

	"github.com/99designs/gqlgen/graphql"
)

// https://github.com/99designs/gqlgen/issues/866#issuecomment-737684323

type argumentSelector = func(v any) (ret any, ok bool)

// ArgumentsQuery to check whether arg value is null
type ArgumentsQuery struct {
	args      map[string]any
	selectors []argumentSelector
}

func (a ArgumentsQuery) selected() (ret any, ok bool) {
	ret, ok = a.args, true
	for _, fn := range a.selectors {
		ret, ok = fn(ret)
		if !ok {
			break
		}
	}
	return
}

// IsNull return whether selected field value is null.
func (a ArgumentsQuery) IsNull() bool {
	v, ok := a.selected()
	return ok && v == nil
}

func (a ArgumentsQuery) child(fn argumentSelector) ArgumentsQuery {
	var selectors = make([]argumentSelector, 0, len(a.selectors)+1)
	selectors = append(selectors, a.selectors...)
	selectors = append(selectors, fn)
	return ArgumentsQuery{
		args:      a.args,
		selectors: selectors,
	}
}

// Field select field by name, returns a new query.
func (a ArgumentsQuery) Field(name string) ArgumentsQuery {
	return a.child(func(v any) (ret any, ok bool) {
		var m map[string]any
		if m, ok = v.(map[string]any); ok {
			ret, ok = m[name]
		}
		return
	})

}

// Index select field by array index, returns a new query.
func (a ArgumentsQuery) Index(index int) ArgumentsQuery {
	return a.child(func(v any) (ret any, ok bool) {
		if index < 0 {
			return
		}
		var a []any
		if a, ok = v.([]any); ok {
			if index > len(a)-1 {
				ok = false
				return
			}
			ret = a[index]
		}
		return
	})
}

// Arguments query to check whether args value is null.
// https://github.com/99designs/gqlgen/issues/866
func Arguments(ctx context.Context) (ret ArgumentsQuery) {
	fc := graphql.GetFieldContext(ctx)
	oc := graphql.GetOperationContext(ctx)

	if fc == nil || oc == nil {
		return
	}
	ret.args = fc.Field.ArgumentMap(oc.Variables)
	return
}
