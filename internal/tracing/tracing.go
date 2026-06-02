package tracing

import (
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"
)

// RecordError marks the span as errored and records the error. No-op if err is nil.
// Call before span.End() so the status is set on the right span lifecycle.
func RecordError(span trace.Span, err error) {
	if err == nil {
		return
	}
	span.RecordError(err)
	span.SetStatus(codes.Error, err.Error())
}
