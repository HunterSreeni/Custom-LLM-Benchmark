# Architecture Proposal: Order Processing Pipeline

## Overview

We propose migrating our monolithic order processing system to an event-driven microservice architecture. This will improve scalability, allow independent deployments, and reduce coupling between teams.

## Current State

The existing monolith handles ~2,000 orders/minute at peak. Order processing involves:
1. Validate order details
2. Reserve inventory
3. Charge payment
4. Update order status
5. Send confirmation email

All steps happen in a single database transaction. If any step fails, the entire transaction rolls back.

## Proposed Architecture

```
[API Gateway]
     |
     v
[Order Service] --publish--> [Message Queue (RabbitMQ)]
                                    |
                                    v
                             [Fulfillment Service] --write--> [PostgreSQL]
                                    |
                                    v
                             [Notification Service]
```

### Component Details

**Order Service**
- Receives HTTP requests from the API gateway
- Validates order payload (schema, business rules)
- Publishes an `OrderCreated` event to RabbitMQ
- Returns HTTP 202 Accepted immediately

**Message Queue (RabbitMQ)**
- Durable queue with `auto_ack=true` for maximum throughput
- Messages are JSON-encoded order events
- Single queue named `orders.processing`

**Fulfillment Service**
- Consumes `OrderCreated` events from the queue
- Step 1: Reserves inventory in the database
- Step 2: Calls Stripe API to charge payment
- Step 3: Updates order status to "completed" in PostgreSQL
- Step 4: Publishes `OrderCompleted` event for Notification Service

Processing logic (pseudocode):
```python
def process_order(message):
    order = json.loads(message.body)
    
    # Step 1: Reserve inventory
    db.execute("UPDATE inventory SET reserved = reserved + ? WHERE sku = ?",
               order['quantity'], order['sku'])
    
    # Step 2: Charge payment
    stripe.charges.create(amount=order['total'], customer=order['customer_id'])
    
    # Step 3: Mark order completed
    db.execute("UPDATE orders SET status = 'completed' WHERE id = ?", order['id'])
    
    # Step 4: Notify
    queue.publish('orders.notifications', {'order_id': order['id'], 'type': 'completed'})
```

**Notification Service**
- Consumes `OrderCompleted` events
- Sends confirmation email to customer
- Sends Slack notification to fulfillment team

### Scaling Strategy

- Order Service: Horizontally scaled behind load balancer (3-10 pods)
- Fulfillment Service: Scaled based on queue depth (2-8 pods)
- RabbitMQ: 3-node cluster with mirrored queues
- PostgreSQL: Primary-replica setup with read replicas

### Failure Handling

- If the Fulfillment Service crashes, messages remain in the queue and will be redelivered when the service restarts
- If PostgreSQL is down, the Fulfillment Service will retry with exponential backoff
- If Stripe is down, the Fulfillment Service will retry the payment call up to 3 times

### Migration Plan

1. Deploy new services alongside monolith
2. Shadow traffic to new pipeline for 2 weeks
3. Gradually shift 10% -> 50% -> 100% of traffic
4. Decommission monolith after 30 days of stable operation

### Performance Targets

- Order ingestion: <100ms p99 latency
- End-to-end processing: <5s for 95% of orders
- Throughput: 5,000 orders/minute at peak
- Availability: 99.95% uptime

## Team Ownership

- Order Service: Checkout Team
- Fulfillment Service: Fulfillment Team
- Notification Service: Communications Team
- Infrastructure: Platform Team
