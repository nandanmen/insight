# Test Cases

# Add Dataset

## Invalid IDs

-   [x] Contains underscore
-   [x] Only whitespace
-   [x] Was previously added

## Invalid Zips

-   [x] Not a zip file
-   [x] Zip file does not contain a folder called "courses"
-   [x] Courses folder is empty
-   [x] Courses folder does not contain a valid section
    -   [x] They are all invalid
    -   [x] They are all valid but have no valid sections

## Invalid Courses

-   [x] Not JSON
-   [x] Does not have a "result" field

## Additional Tests

-   [x] Mix of valid and invalid sections

# Remove Dataset

-   [x] Returns InsightError for invalid ids
    -   [x] Ids with only whitespace
    -   [x] Ids with an underscore
-   [x] Returns NotFoundError if id is valid but does not exist

# Perform Query

## Valid Queries

### Columns

-   [ ] Dept
-   [ ] Id
-   [ ] Avg
-   [ ] Instructor
-   [ ] Title
-   [ ] Pass
-   [ ] Fail
-   [ ] Audit
-   [ ] Uuid
-   [ ] Year
-   [ ] Mix

### Orders

-   [ ] Dept
-   [ ] Id
-   [ ] Avg
-   [ ] Instructor
-   [ ] Title
-   [ ] Pass
-   [ ] Fail
-   [ ] Audit
-   [ ] Uuid
-   [ ] Year

### Filters - LOGIC

-   [x] AND
-   [x] OR

### Filters - MCOMPARISON

-   [x] LT
-   [x] GT
-   [x] EQ

### Filters - SCOMPARISON

-   [ ] Dept
-   [ ] Id
-   [ ] Instructor
-   [ ] Title
-   [ ] Uuid
-   [x] Asteriks
    -   [x] At start
    -   [x] At end
    -   [x] At start and end

### Filters - Etc

-   [x] Negation
-   [x] Combination of filters
-   [x] Deep nesting of filters

## Type Errors

### Options

-   [x] COLUMNS is array
    -   [x] COLUMNS array is non-empty
-   [x] ORDER is key

### Filters

-   [x] Key is of form `idstring + _ + key`
-   [x] LOGICCOMPARISON has key LOGIC, with value non-empty array
-   [x] MCOMPARISON has key MCOMPARATOR, with value:
    -   [x] Key is mkey
    -   [x] Value is number
-   [x] SCOMPARISON has key `IS`, with value:
    -   [x] Key is skey
    -   [x] Value is `inputString`, with optional asterisks at start and end (cannot be in middle)
        -   [x] Value must be type string
        -   [x] `inputString` must conform to `[^*]*`
-   [x] NEGATION is of type object with key = FILTER
-   [x] FILTER is **one of** LOGICCOMPARISON, MCOMPARISON, SCOMPARISON, NEGATION

## Invalid Queries

-   [x] BODY must contain both WHERE and OPTIONS blocks
-   [x] WHERE should have at most one FILTER
-   [x] OPTIONS must contain COLUMNS
-   [x] If ORDER is included, the ORDER key must be in COLUMNS
-   [x] Keys in COLUMNS must be prefixed with the **same** dataset id
-   [x] Key prefix must reference a dataset that exists

## Misc Tests

-   [x] Return `ResultTooLarge` on query results > 5000
