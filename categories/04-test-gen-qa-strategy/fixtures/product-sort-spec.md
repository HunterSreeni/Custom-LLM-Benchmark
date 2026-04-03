# Feature Specification - Product List Sorting

## Overview
The product listing page displays a sortable grid of products. Users can sort by various attributes. This spec covers the "Sort by Price" behavior.

## Requirements

### SR-1: Default Sort Order
Products should be sortable by price. When "Price: Low to High" is selected, the lowest-priced products appear first.

### SR-2: Stable Sort
Products with the same price should maintain their original catalog order (i.e., the sort is stable).

### SR-3: Free Products
Free products (price = $0.00) should appear at the end of the list, regardless of sort direction.

### SR-4: Sort Direction
- "Price: Low to High" - ascending price order.
- "Price: High to Low" - descending price order.

### SR-5: Null Prices
Products with no price set (null) should be excluded from the sorted list and displayed in a separate "Price Unavailable" section below the sorted results.

## Example Data
| Product    | Price  |
|------------|--------|
| Widget A   | $5.00  |
| Widget B   | $0.00  |
| Widget C   | $5.00  |
| Widget D   | $10.00 |
| Widget E   | $0.00  |
| Widget F   | null   |

## Expected Result ("Price: Low to High")
1. Widget A - $5.00
2. Widget C - $5.00
3. Widget D - $10.00
4. Widget B - $0.00
5. Widget E - $0.00
---
Price Unavailable: Widget F
