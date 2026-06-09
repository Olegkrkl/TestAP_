"""Grading logic for all question types."""
from typing import Any


def grade_answer_partial(question_type: str, options: dict, user_answer: Any) -> float:
    """Return a float 0.0–1.0 representing the fraction of points earned.
    For types that are all-or-nothing, delegates to grade_answer and returns 0.0 or 1.0.
    """
    if user_answer is None:
        return 0.0

    correct = options.get("correct")

    if question_type == "multiple-choice":
        if not isinstance(user_answer, list) or not isinstance(correct, list):
            return 0.0
        correct_set = {str(x) for x in correct}
        user_set = {str(x) for x in user_answer}
        if not correct_set:
            return 0.0
        hits = len(correct_set & user_set)
        wrong = len(user_set - correct_set)
        score = max(0, hits - wrong) / len(correct_set)
        return round(score, 4)

    if question_type == "matching":
        if not isinstance(user_answer, dict) or not isinstance(correct, dict):
            return 0.0
        correct_pairs = {str(k): str(v) for k, v in correct.items()}
        user_pairs = {str(k): str(v) for k, v in user_answer.items()}
        if not correct_pairs:
            return 0.0
        hits = sum(1 for k, v in correct_pairs.items() if user_pairs.get(k) == v)
        return round(hits / len(correct_pairs), 4)

    # All other types: full points or none
    return 1.0 if grade_answer(question_type, options, user_answer) else 0.0


def grade_answer(question_type: str, options: dict, user_answer: Any) -> bool:
    """Return True if the answer is correct."""
    if user_answer is None:
        return False

    correct = options.get("correct")

    if question_type == "single-choice":
        return str(user_answer) == str(correct)

    elif question_type == "multiple-choice":
        if not isinstance(user_answer, list) or not isinstance(correct, list):
            return False
        return set(str(x) for x in user_answer) == set(str(x) for x in correct)

    elif question_type == "true-false":
        return str(user_answer).lower() == str(correct).lower()

    elif question_type == "ordering":
        if not isinstance(user_answer, list) or not isinstance(correct, list):
            return False
        return [str(x) for x in user_answer] == [str(x) for x in correct]

    elif question_type == "matching":
        if not isinstance(user_answer, dict) or not isinstance(correct, dict):
            return False
        return {str(k): str(v) for k, v in user_answer.items()} == {str(k): str(v) for k, v in correct.items()}

    elif question_type == "fill-blank":
        if isinstance(correct, list):
            return str(user_answer).strip().lower() in [str(c).strip().lower() for c in correct]
        return str(user_answer).strip().lower() == str(correct).strip().lower()

    elif question_type == "open-answer":
        auto_keywords = options.get("auto_keywords", [])
        if auto_keywords:
            answer_lower = str(user_answer).lower()
            return all(kw.lower() in answer_lower for kw in auto_keywords)
        return False

    return False


def get_correct_answer(question_type: str, options: dict) -> Any:
    """Return the correct answer representation for display."""
    return options.get("correct")
