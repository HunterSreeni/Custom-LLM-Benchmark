# Real-time Analytics Dashboard Specification

## Overview
Build a real-time analytics dashboard using Vue 3 that consumes live data from a WebSocket feed and renders multiple chart types. The dashboard should handle connection failures gracefully and allow users to filter data by time range.

## Requirements

### WebSocket Connection (`useWebSocket` composable)
- Connect to `ws://localhost:8080/analytics` on mount.
- Parse incoming JSON messages with schema: `{ type: "metric", metric: string, value: number, timestamp: string }`.
- Implement auto-reconnect with exponential backoff: initial delay 1s, max delay 30s, multiplied by 2 each attempt.
- Expose reactive state: `status` ("connecting", "connected", "disconnected", "error"), `lastMessage`, `error`.
- Provide `connect()`, `disconnect()`, and `send(data)` methods.
- Clean up the connection on component unmount.

### Data Store (`useAnalyticsStore` - Pinia)
- Maintain a rolling window of metrics. Keep the last 1000 data points per metric type.
- Computed getters for each time range: last 1h, last 6h, last 24h, last 7d.
- Computed getters for aggregations: average, min, max, current value per metric.
- Action to clear historical data.

### Chart Components
- **LineChart.vue**: Time series line chart for metrics over time. X-axis is time, Y-axis is value. Support multiple series overlay.
- **BarChart.vue**: Comparison bar chart for current values across different metrics.
- **PieChart.vue**: Distribution chart showing percentage breakdown of metric categories.
- All charts must be responsive and resize with the container.
- Use either Chart.js, D3, or build with SVG/Canvas directly - document the choice.

### Dashboard Layout
- Header with connection status indicator (green dot = connected, yellow = connecting, red = disconnected).
- Time range selector: buttons for 1h, 6h, 24h, 7d. Active range highlighted.
- Grid layout with 2 columns on desktop, 1 column on mobile.
- Summary cards at the top showing current values for key metrics.
- Each chart in a card with a title, last-updated timestamp, and a loading skeleton while waiting for initial data.

### Error States
- Show a reconnection banner when disconnected with a manual "Reconnect" button.
- Display "Waiting for data..." skeleton when connected but no data received yet.
- Handle malformed WebSocket messages gracefully - log and skip without crashing.

## Deliverables
- `composables/useWebSocket.ts` - WebSocket connection composable
- `stores/analytics.ts` - Pinia analytics store
- `components/LineChart.vue`, `BarChart.vue`, `PieChart.vue` - chart components
- `components/StatusIndicator.vue` - connection status dot
- `components/TimeRangeSelector.vue` - time range buttons
- `views/Dashboard.vue` - main dashboard page
- `types/analytics.ts` - TypeScript interfaces
