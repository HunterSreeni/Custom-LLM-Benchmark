use std::env;
use std::fs;
use std::time::Instant;

/// A CLI tool that parses log files and filters entries by keyword.
/// Usage: logfilter <log-file> <keyword1> [keyword2] [keyword3] ...
///
/// Known issue: Users report it takes ~45 seconds to process a 200MB log file,
/// while similar tools finish in under 3 seconds.

fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() < 3 {
        eprintln!("Usage: logfilter <log-file> <keyword1> [keyword2] ...");
        std::process::exit(1);
    }

    let file_path = &args[1];
    let keywords: Vec<String> = args[2..].to_vec();

    let start = Instant::now();

    // BUG 1: Reads entire file into memory at once.
    // For a 200MB file, this allocates 200MB+ of RAM immediately.
    // Should use BufReader for line-by-line streaming.
    let contents = fs::read_to_string(file_path).unwrap_or_else(|e| {
        eprintln!("Error reading file '{}': {}", file_path, e);
        std::process::exit(1);
    });

    let lines: Vec<&str> = contents.lines().collect();
    let total_lines = lines.len();
    let mut matched_lines: Vec<String> = Vec::new();

    for line in &lines {
        // BUG 2: Clones the entire line string on every iteration,
        // even if it won't match. This is unnecessary - we only need
        // a reference until we decide to keep the line.
        let line_owned: String = line.to_string();

        if matches_any_keyword(&line_owned, &keywords) {
            // BUG 3: Clones again when pushing to results.
            // The first clone was already wasteful; this doubles it.
            matched_lines.push(line_owned.clone());
        }
    }

    let elapsed = start.elapsed();

    println!("Processed {} lines in {:.2?}", total_lines, elapsed);
    println!("Found {} matching lines:", matched_lines.len());
    println!("---");

    for matched in &matched_lines {
        println!("{}", matched);
    }
}

/// Check if a line contains any of the given keywords.
fn matches_any_keyword(line: &str, keywords: &[String]) -> bool {
    let line_lower = line.to_lowercase();

    for keyword in keywords {
        // BUG 4: .to_lowercase() is called on every keyword for every line.
        // Should pre-compute lowercased keywords once before the loop.
        let kw_lower = keyword.to_lowercase();

        // BUG 5: Using Vec::contains with linear scan.
        // If there were many keywords, this is O(n) per check.
        // More critically, we're doing a substring search (.contains on &str)
        // but the real issue is the repeated allocation from to_lowercase().
        if line_lower.contains(&kw_lower) {
            return true;
        }
    }
    false
}

/// Deduplicates matched lines by comparing each against all others.
/// Called if --dedup flag is passed (not shown in main for brevity).
#[allow(dead_code)]
fn deduplicate(lines: &[String]) -> Vec<String> {
    let mut unique: Vec<String> = Vec::new();

    for line in lines {
        // BUG 6: O(n^2) deduplication using Vec::contains instead of HashSet.
        // For 100k matched lines, this does ~5 billion comparisons.
        if !unique.contains(line) {
            unique.push(line.clone());
        }
    }

    unique
}
