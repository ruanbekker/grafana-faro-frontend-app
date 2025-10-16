# Grafana Faro Test Application

A test application for Grafana Faro observability integration.

## Requirements

You will need a stack with Alloy, Grafana, Loki, etc:

- [helm-values.yaml](https://github.com/ruanbekker/grafana-alloy-examples/blob/main/values/alloy-faro-latest.yaml)

## Features

- Console logging tests
- Custom event tracking
- Error simulation and handling
- Performance monitoring
- User context management
- Form interaction tracking
- Network request monitoring

## Quick Start

### Development

```bash
npm install
npm run dev
```

### Queries

<details>
  <summary>Loki Queries</summary>

To view logs for specific events:

```
{source="frontend"} | logfmt | event_name="faro.tracing.fetch"
```

or:

```
{source="frontend"} | logfmt 
| event_name="faro.tracing.fetch" 
| event_domain="browser" 
| event_data_http_method="GET"
```

### Queries: Metrics from Logs

HTTP Request Duration by Endpoint:

```
sum by (event_data_http_url) (
  rate({app_name="faro-app"} 
  | json 
  | event_name="faro.tracing.fetch" 
  | unwrap event_data_duration_ns [1m])
)
```

HTTP Error Rate:

```
sum by (event_data_http_status_code) (
  count_over_time({app_name="faro-app"} 
  | json 
  | event_name="faro.tracing.fetch" 
  | event_data_http_status_code!="200" [5m])
)
```

Request Volume by Component:

```
sum by (event_data_component) (
  rate({app_name="faro-test-app"} 
  | json 
  | event_domain="browser" 
  | event_name=~"faro.tracing.*" [1m])
)
```

User Session Activity

```
count by (user_id) (
  {app_name="faro-test-app"} 
  | json 
  | user_id!="" 
  | by(user_id, session_id)
)
```

Browser Version Distribution

```
count by (browser_name, browser_version) (
  {app_name="faro-test-app"} 
  | json 
  | by(browser_name, browser_version)
)
```

Request Duration Histogram

```
histogram_quantile(0.95,
  sum by (le) (
    rate({app_name="faro-test-app"} 
    | json 
    | event_name="faro.tracing.fetch" 
    | unwrap duration_seconds=event_data_duration_ns / 1000000000 
    | duration_seconds < 10
    | histogram_quantile_buckets(duration_seconds, 0.05, 0.1, 0.2, 0.5, 1, 2, 5) [5m]
    )
  )
)
```

Error Count by Browser Type

```
sum by (browser_name) (
  count_over_time({app_name="faro-test-app"} 
  | json 
  | event_name="faro.tracing.fetch" 
  | event_data_http_status_code=~"4.*|5.*" 
  | event_data_http_status_code!="" [5m])
)
```

Average Request Duration Over Time

```
avg_over_time({app_name="faro-test-app"} 
| json 
| event_name="faro.tracing.fetch" 
| unwrap event_data_duration_ns / 1000000 [5m]) # Convert to milliseconds
```

</details>

<details>
  <summary>Tempo Queries</summary>

To view the spans of a service called `faro-app`:

```
{resource.service.name="faro-app"}
```

</details>
