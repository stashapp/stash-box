package query_test

import (
	"go/ast"
	"go/types"
	"strings"
	"testing"

	"golang.org/x/tools/go/packages"
)

// squirrel predicates that expand a list rather than binding a single value.
var squirrelPredicates = map[string]bool{
	"Eq": true, "NotEq": true,
	"Lt": true, "LtOrEq": true,
	"Gt": true, "GtOrEq": true,
}

// TestNoRawUUIDInSquirrelPredicates guards against squirrel expanding a bare
// UUID into one placeholder per byte. It skips that expansion only for values
// implementing driver.Valuer, which the stdlib uuid.UUID does not.
func TestNoRawUUIDInSquirrelPredicates(t *testing.T) {
	cfg := &packages.Config{
		Mode: packages.NeedName | packages.NeedSyntax | packages.NeedTypes | packages.NeedTypesInfo,
	}
	pkgs, err := packages.Load(cfg, "github.com/stashapp/stash-box/internal/...")
	if err != nil {
		t.Fatalf("loading packages: %v", err)
	}
	for _, pkg := range pkgs {
		for _, pkgErr := range pkg.Errors {
			t.Errorf("loading package %s: %v", pkg.PkgPath, pkgErr)
		}
	}
	if t.Failed() {
		t.FailNow()
	}

	for _, pkg := range pkgs {
		for i, file := range pkg.Syntax {
			ast.Inspect(file, func(n ast.Node) bool {
				lit, ok := n.(*ast.CompositeLit)
				if !ok || !isSquirrelPredicate(pkg.TypesInfo.TypeOf(lit.Type)) {
					return true
				}
				for _, elt := range lit.Elts {
					kv, ok := elt.(*ast.KeyValueExpr)
					if !ok {
						continue
					}
					if isUUID(pkg.TypesInfo.TypeOf(kv.Value)) {
						pos := pkg.Fset.Position(kv.Value.Pos())
						t.Errorf("%s: bare UUID in a squirrel predicate expands to 16 placeholders; "+
							"use queryhelper.EqUUID/NotEqUUID or wrap in queryhelper.UUIDArg", pos)
					}
				}
				return true
			})
			_ = i
		}
	}
}

func isSquirrelPredicate(t types.Type) bool {
	named, ok := t.(*types.Named)
	if !ok {
		return false
	}
	obj := named.Obj()
	return obj.Pkg() != nil &&
		strings.HasSuffix(obj.Pkg().Path(), "Masterminds/squirrel") &&
		squirrelPredicates[obj.Name()]
}

func isUUID(t types.Type) bool {
	if ptr, ok := t.(*types.Pointer); ok {
		t = ptr.Elem()
	}
	named, ok := t.(*types.Named)
	if !ok {
		return false
	}
	obj := named.Obj()
	return obj.Pkg() != nil && obj.Pkg().Path() == "uuid" && obj.Name() == "UUID"
}
