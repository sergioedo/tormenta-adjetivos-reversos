#!/bin/bash

# Replace 'your_endpoint_here' with the actual endpoint
ENDPOINT="http://localhost:3000"

# Output CSV file
CSV_FILE="output.csv"

# Number of simulation iterations
ITERATIONS=100

# Initialize variables
TMP_FILE=$(mktemp)
# TOTAL_WORDS=$(jq '. | length' <<< "$(<your JSON response here)")

for ((i = 1; i <= ITERATIONS; i++)); do
    # Make the request and store the JSON response in a variable
    JSON_RESPONSE=$(curl -s $ENDPOINT)

    # Check if the request was successful
    if [ $? -eq 0 ]; then
        # Process each word in the JSON response
        jq -c '.[]' <<< "$JSON_RESPONSE" | while read -r word; do
            # Extract the word
            echo "$word"
            # current_word=$(jq -r '.word' <<< "$word")
            current_word=$word

            # Count occurrences of the word in the JSON response
            word_occurrences=$(jq -c ".[] | select(. == $current_word)" <<< "$JSON_RESPONSE" | wc -l)

            # Add the word and its occurrences to the temporary file
            echo "$current_word,$word_occurrences" >> "$TMP_FILE"
        done
    else
        echo "Error: Unable to make the request to $ENDPOINT."
        exit 1
    fi
done

# Sort and output to CSV file
sort -t',' -k2,2nr "$TMP_FILE" > "$CSV_FILE"

# Remove temporary file
rm "$TMP_FILE"

echo "Results written to $CSV_FILE"
