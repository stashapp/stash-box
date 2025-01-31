package logger

import (
	"context"
	"log"

	"github.com/stashapp/stash-box/pkg/manager/config"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
)

func InitTracer() func(context.Context) error {
	otelConfig := config.GetOTelConfig()
	if otelConfig == nil {
		return nil
	}

	exporter, err := otlptrace.New(
		context.Background(),
		otlptracegrpc.NewClient(
			otlptracegrpc.WithInsecure(),
			otlptracegrpc.WithEndpoint(otelConfig.Endpoint),
		),
	)

	if err != nil {
		log.Fatal(err)
	}

	resources, err := resource.New(
		context.Background(),
		resource.WithAttributes(
			attribute.String("service.name", config.GetTitle()),
			attribute.String("library.language", "go"),
		),
	)
	if err != nil {
		log.Print("Could not set resources: ", err)
	}

	otel.SetTracerProvider(
		sdktrace.NewTracerProvider(
			sdktrace.WithSampler(sdktrace.TraceIDRatioBased(otelConfig.TraceRatio)),
			sdktrace.WithBatcher(exporter),
			sdktrace.WithResource(resources),
		),
	)

	logger.Infof("otel initialized with collector: %s, ratio: %f", otelConfig.Endpoint, otelConfig.TraceRatio)

	return exporter.Shutdown
}
