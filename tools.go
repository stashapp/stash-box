//go:build tools
// +build tools

package main

import (
	_ "github.com/99designs/gqlgen/cmd"
	_ "github.com/kisielk/errcheck"
	_ "github.com/vektah/dataloaden"
	_ "honnef.co/go/tools/cmd/staticcheck"
)
