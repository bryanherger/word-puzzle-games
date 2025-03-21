import json
import itertools
from collections import Counter

# Path to the system word list (adjust if needed)
#WORD_LIST_PATH = '/usr/share/dict/words'
WORD_LIST_PATH = 'spelling_words.txt'
# Input file with 100 words (one per line)
INPUT_FILE = 'fiveorsix.txt'
# Output JSON file
OUTPUT_FILE = 'puzzles.json'

def load_word_list():
    """Load the system word list into a set for fast lookup."""
    with open(WORD_LIST_PATH, 'r') as f:
        return set(word.strip().lower() for word in f)

def load_input_words():
    """Load the input words from the file."""
    with open(INPUT_FILE, 'r') as f:
        return [word.strip().upper() for word in f if 5 <= len(word.strip()) <= 6]

def get_valid_subwords(letters):
    """Generate all valid sub-words from the given letters."""
    letter_count = Counter(letters)
    valid_words = set()
    word_list = load_word_list()

    # Generate all possible combinations of letters (length 3 to len(letters))
    for length in range(3, len(letters) + 1):
        for combo in itertools.permutations(letters, length):
            word = ''.join(combo).lower()
            # Check if the word is valid and respects letter frequency
            word_counter = Counter(word)
            if (word in word_list and 
                all(word_counter[c] <= letter_count[c.upper()] for c in word_counter)):
                valid_words.add(word.upper())

    return sorted(list(valid_words), key=lambda x: (len(x), x))

def generate_puzzles():
    """Generate the puzzles JSON from input words."""
    input_words = load_input_words()
    puzzles = []

    for word in input_words:
        letters = list(word)
        answers = get_valid_subwords(letters)
        if answers and len(answers) >= 3 and len(answers) <= 6:  # Ensure at least 3 valid answers but no more than 6
            puzzles.append({
                "letters": letters,
                "answers": answers
            })

    return puzzles

def main():
    """Main function to run the script and write output."""
    puzzles = generate_puzzles()
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(puzzles, f, indent=2)
    print(f"Generated {len(puzzles)} puzzles and saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
