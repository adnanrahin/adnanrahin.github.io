---
title: Two Pointers Pattern — When and How
date: 2026-01-20
description: A core technique for sorted arrays, linked lists, and sliding-window problems.
tags: [algorithms, two-pointers, arrays]
---

The two-pointer technique uses two indices moving through a structure — often from opposite ends or at different speeds.

## When to use it

- Input is **sorted** (or can be sorted)
- Need to find a **pair** matching a condition
- **In-place** array modification (remove duplicates, move zeros)
- **Linked list** cycle detection (fast/slow pointers)

## Classic example — two sum on sorted array

```python
def two_sum_sorted(nums, target):
    left, right = 0, len(nums) - 1
    while left < right:
        current = nums[left] + nums[right]
        if current == target:
            return [left, right]
        if current < target:
            left += 1
        else:
            right -= 1
    return []
```

**Time:** O(n) · **Space:** O(1)

## Interview tip

State why two pointers beat a hash map here: sorted input lets you eliminate half the search space each step.
