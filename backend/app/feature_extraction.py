import math
import re
from collections import Counter
from typing import Dict, List


FEATURE_NAMES = [
    "char_count",
    "word_count",
    "sentence_count",
    "paragraph_count",
    "avg_word_length",
    "avg_sentence_length",
    "sentence_length_std",
    "type_token_ratio",
    "punctuation_ratio",
    "comma_ratio",
    "question_ratio",
    "exclamation_ratio",
    "contraction_count",
    "contraction_ratio",
    "stopword_ratio",
    "repeated_bigram_ratio",
    "repeated_trigram_ratio",
    "flesch_reading_ease",
    "flesch_kincaid_grade",
]

STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "been", "but", "by", "can",
    "could", "did", "do", "does", "for", "from", "had", "has", "have", "he",
    "her", "his", "i", "if", "in", "into", "is", "it", "its", "me", "my",
    "no", "not", "of", "on", "or", "our", "she", "so", "that", "the",
    "their", "them", "then", "there", "they", "this", "to", "up", "was",
    "we", "were", "what", "when", "which", "who", "will", "with", "would",
    "you", "your",
}

WORD_RE = re.compile(r"[A-Za-z]+(?:'[A-Za-z]+)?")
SENTENCE_RE = re.compile(r"[^.!?]+[.!?]*")
PUNCT_RE = re.compile(r"[^\w\s]")
CONTRACTION_RE = re.compile(r"\b\w+'(?:t|re|ve|ll|d|m|s)\b", re.IGNORECASE)
VOWEL_GROUP_RE = re.compile(r"[aeiouy]+", re.IGNORECASE)


def _safe_div(num: float, den: float) -> float:
    return float(num / den) if den else 0.0


def _tokenize_words(text: str) -> List[str]:
    return [m.group(0).lower() for m in WORD_RE.finditer(text or "")]


def _sentence_lengths(text: str) -> List[int]:
    lengths = []
    for sentence in SENTENCE_RE.findall(text or ""):
        words = _tokenize_words(sentence)
        if words:
            lengths.append(len(words))
    return lengths


def _repeated_ngram_ratio(words: List[str], n: int) -> float:
    if len(words) < n:
        return 0.0
    grams = [tuple(words[i : i + n]) for i in range(len(words) - n + 1)]
    counts = Counter(grams)
    repeated = sum(count - 1 for count in counts.values() if count > 1)
    return _safe_div(repeated, len(grams))


def _count_syllables(word: str) -> int:
    cleaned = re.sub(r"[^a-z]", "", word.lower())
    if not cleaned:
        return 0
    groups = VOWEL_GROUP_RE.findall(cleaned)
    count = len(groups)
    if cleaned.endswith("e") and count > 1:
        count -= 1
    return max(count, 1)


def extract_features(text: str) -> Dict[str, float]:
    text = text or ""
    words = _tokenize_words(text)
    word_count = len(words)
    char_count = len(text)
    sentences = _sentence_lengths(text)
    sentence_count = max(len(sentences), 1 if word_count else 0)
    paragraph_count = len([p for p in re.split(r"\n\s*\n", text.strip()) if p.strip()])
    paragraph_count = paragraph_count or (1 if text.strip() else 0)
    punctuation_count = len(PUNCT_RE.findall(text))
    contractions = len(CONTRACTION_RE.findall(text))
    syllables = sum(_count_syllables(word) for word in words)

    avg_sentence_length = _safe_div(word_count, sentence_count)
    if sentences:
        mean = sum(sentences) / len(sentences)
        variance = sum((x - mean) ** 2 for x in sentences) / len(sentences)
        sentence_length_std = math.sqrt(variance)
    else:
        sentence_length_std = 0.0

    flesch = (
        206.835
        - 1.015 * _safe_div(word_count, sentence_count)
        - 84.6 * _safe_div(syllables, word_count)
        if word_count and sentence_count
        else 0.0
    )
    fk_grade = (
        0.39 * _safe_div(word_count, sentence_count)
        + 11.8 * _safe_div(syllables, word_count)
        - 15.59
        if word_count and sentence_count
        else 0.0
    )

    return {
        "char_count": float(char_count),
        "word_count": float(word_count),
        "sentence_count": float(sentence_count),
        "paragraph_count": float(paragraph_count),
        "avg_word_length": _safe_div(sum(len(w) for w in words), word_count),
        "avg_sentence_length": avg_sentence_length,
        "sentence_length_std": sentence_length_std,
        "type_token_ratio": _safe_div(len(set(words)), word_count),
        "punctuation_ratio": _safe_div(punctuation_count, max(char_count, 1)),
        "comma_ratio": _safe_div(text.count(","), max(char_count, 1)),
        "question_ratio": _safe_div(text.count("?"), max(char_count, 1)),
        "exclamation_ratio": _safe_div(text.count("!"), max(char_count, 1)),
        "contraction_count": float(contractions),
        "contraction_ratio": _safe_div(contractions, word_count),
        "stopword_ratio": _safe_div(sum(1 for w in words if w in STOPWORDS), word_count),
        "repeated_bigram_ratio": _repeated_ngram_ratio(words, 2),
        "repeated_trigram_ratio": _repeated_ngram_ratio(words, 3),
        "flesch_reading_ease": float(flesch),
        "flesch_kincaid_grade": float(fk_grade),
    }
