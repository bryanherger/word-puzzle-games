import sys
import string

def filter_words(min_length=3, max_length=6, exclude_proper_nouns=False, exclude_punctuation=False):
    words = sys.stdin.read().split()
    filtered_words = [word for word in words if min_length <= len(word) <= max_length]
    
    if exclude_proper_nouns:
        filtered_words = [word for word in filtered_words if not word[0].isupper()]
    
    if exclude_punctuation:
        filtered_words = [word for word in filtered_words if word.isascii() and all(char.isalnum() or char.isspace() for char in word)]
    
    for word in filtered_words:
        print(word)

# Example usage
filter_words(exclude_proper_nouns=True, exclude_punctuation=True)
