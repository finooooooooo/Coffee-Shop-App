# Merge Sort Implementation for Educational Purposes
# Sorting algorithm used to sort products by price or name.

def merge_sort(items, key='price', reverse=False):
    """
    Sorts a list of dictionaries (products) using the Merge Sort algorithm.

    :param items: List of dictionaries to sort.
    :param key: The key to sort by (e.g., 'price' or 'name').
    :param reverse: Boolean, if True sorts in descending order.
    :return: A new sorted list.
    """
    if len(items) <= 1:
        return items

    # Divide the list into two halves
    mid = len(items) // 2
    left_half = items[:mid]
    right_half = items[mid:]

    # Recursively sort both halves
    sorted_left = merge_sort(left_half, key, reverse)
    sorted_right = merge_sort(right_half, key, reverse)

    # Merge the sorted halves
    return merge(sorted_left, sorted_right, key, reverse)

def merge(left, right, key, reverse):
    """
    Helper function to merge two sorted lists.
    """
    sorted_list = []
    i = j = 0

    while i < len(left) and j < len(right):
        left_val = left[i].get(key)
        right_val = right[j].get(key)

        # Compare values based on the reverse flag
        if reverse:
            if left_val > right_val:
                sorted_list.append(left[i])
                i += 1
            else:
                sorted_list.append(right[j])
                j += 1
        else:
            if left_val < right_val:
                sorted_list.append(left[i])
                i += 1
            else:
                sorted_list.append(right[j])
                j += 1

    # Append any remaining items
    sorted_list.extend(left[i:])
    sorted_list.extend(right[j:])

    return sorted_list
