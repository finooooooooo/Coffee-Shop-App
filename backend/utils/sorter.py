# MERGE SORT ALGORITHM IMPLEMENTATION
# This file demonstrates a manual implementation of the Merge Sort algorithm.
# Merge Sort is a "Divide and Conquer" algorithm.

def merge_sort(items, key='price', reverse=False):
    """
    Sorts a list of dictionaries (products) using Merge Sort.

    Complexity: O(n log n) - Very efficient for large datasets.

    :param items: List of dictionaries to sort.
    :param key: The dictionary key to sort by (e.g., 'price' or 'name').
    :param reverse: If True, sort descending (High to Low).
    :return: A new sorted list.
    """
    # Base Case: A list of 0 or 1 elements is already sorted.
    if len(items) <= 1:
        return items

    # DIVIDE: Split the list into two halves
    mid = len(items) // 2
    left_half = items[:mid]
    right_half = items[mid:]

    # CONQUER: Recursively sort both halves
    sorted_left = merge_sort(left_half, key, reverse)
    sorted_right = merge_sort(right_half, key, reverse)

    # COMBINE: Merge the sorted halves together
    return merge(sorted_left, sorted_right, key, reverse)

def merge(left, right, key, reverse):
    """
    Helper function to merge two sorted lists into one.
    """
    sorted_list = []
    i = j = 0

    while i < len(left) and j < len(right):
        left_val = left[i].get(key)
        right_val = right[j].get(key)

        # Comparison logic
        if reverse:
            # For Descending: Choose the LARGER value
            if left_val > right_val:
                sorted_list.append(left[i])
                i += 1
            else:
                sorted_list.append(right[j])
                j += 1
        else:
            # For Ascending: Choose the SMALLER value
            if left_val < right_val:
                sorted_list.append(left[i])
                i += 1
            else:
                sorted_list.append(right[j])
                j += 1

    # Add any remaining elements from the left or right list
    sorted_list.extend(left[i:])
    sorted_list.extend(right[j:])

    return sorted_list
