from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import List, Optional
from app.core.database import get_db
from app.core.deps import CurrentUser, TeacherUser
from app.models.result import Result
from app.models.session import TestSession
from app.models.test import Test
from app.models.user import User
from app.schemas.session import ResultOut, QuestionStatOut

router = APIRouter(prefix="/results", tags=["results"])


def _result_out(res: Result, violations: int = 0) -> ResultOut:
    stats = [QuestionStatOut(**s) for s in (res.per_question_stats or [])]
    return ResultOut(
        id=res.id, session_id=res.session_id, user_id=res.user_id, test_id=res.test_id,
        score=res.score, max_score=res.max_score, percent=res.percent, passed=res.passed,
        per_question_stats=stats, completed_at=res.completed_at, violations=violations,
    )


@router.get("/my", response_model=List[ResultOut])
async def get_my_results(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    test_id: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 50,
):
    query = select(Result).where(Result.user_id == current_user.id)
    if test_id:
        query = query.where(Result.test_id == test_id)
    query = query.order_by(desc(Result.completed_at)).offset(skip).limit(limit)
    result = await db.execute(query)
    return [_result_out(r) for r in result.scalars().all()]


@router.get("/test/{test_id}", response_model=List[dict])
async def get_test_results(
    test_id: str,
    current_user: TeacherUser,
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    """All results for a test (teacher view)."""
    query = (
        select(Result, User.full_name, User.email, TestSession.violations)
        .join(User, User.id == Result.user_id)
        .join(TestSession, TestSession.id == Result.session_id)
        .where(Result.test_id == test_id)
        .order_by(desc(Result.completed_at))
        .offset(skip).limit(limit)
    )
    rows = await db.execute(query)
    out = []
    for res, name, email, violations in rows.all():
        out.append({
            "id": res.id,
            "user_id": res.user_id,
            "user_name": name,
            "user_email": email,
            "score": res.score,
            "max_score": res.max_score,
            "percent": res.percent,
            "passed": res.passed,
            "violations": violations or 0,
            "completed_at": res.completed_at.isoformat(),
        })
    return out


@router.get("/test/{test_id}/analytics", response_model=dict)
async def get_test_analytics(test_id: str, current_user: TeacherUser, db: AsyncSession = Depends(get_db)):
    results_r = await db.execute(select(Result).where(Result.test_id == test_id))
    results = results_r.scalars().all()

    if not results:
        return {"total_attempts": 0, "average_percent": 0, "pass_rate": 0, "question_stats": []}

    total = len(results)
    avg = sum(r.percent for r in results) / total
    passed = sum(1 for r in results if r.passed)

    question_stats: dict = {}
    for res in results:
        for qs in (res.per_question_stats or []):
            qid = qs.get("question_id")
            if qid not in question_stats:
                question_stats[qid] = {"question_id": qid, "content": qs.get("question_content", ""), "correct": 0, "total": 0}
            question_stats[qid]["total"] += 1
            if qs.get("correct"):
                question_stats[qid]["correct"] += 1

    for qs in question_stats.values():
        qs["accuracy"] = round(qs["correct"] / qs["total"] * 100, 1) if qs["total"] else 0

    sorted_qs = sorted(question_stats.values(), key=lambda x: x["accuracy"])

    # Build a chronological "dynamics" series: group attempts by day and compute
    # the rolling average of percent over time. Frontend uses this for a chart.
    sorted_by_date = sorted(results, key=lambda r: r.completed_at)
    daily: dict = {}
    for r in sorted_by_date:
        day = r.completed_at.date().isoformat()
        daily.setdefault(day, []).append(r.percent)
    dynamics = []
    cum_sum = 0.0
    cum_count = 0
    for day in sorted(daily.keys()):
        vals = daily[day]
        day_avg = sum(vals) / len(vals)
        cum_sum += sum(vals)
        cum_count += len(vals)
        dynamics.append({
            "date": day,
            "attempts": len(vals),
            "average": round(day_avg, 1),
            "rolling_avg": round(cum_sum / cum_count, 1),
            "pass_rate": round(sum(1 for v in vals if v >= 60) / len(vals) * 100, 1),
        })

    return {
        "total_attempts": total,
        "average_percent": round(avg, 1),
        "pass_rate": round(passed / total * 100, 1),
        "question_stats": sorted_qs,
        "hardest_question": sorted_qs[0] if sorted_qs else None,
        "score_distribution": _score_distribution(results),
        "dynamics": dynamics,
    }


def _score_distribution(results: List[Result]) -> List[dict]:
    buckets = [0] * 10
    for r in results:
        idx = min(int(r.percent // 10), 9)
        buckets[idx] += 1
    return [{"range": f"{i*10}-{i*10+9}%", "count": buckets[i]} for i in range(10)]


@router.get("/test/{test_id}/latest")
async def get_latest_for_test(test_id: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    """Most recent result for the current user for a given test, joined with
    test metadata. Used by the mistakes-review UI in history."""
    row = await db.execute(
        select(Result).where(
            Result.user_id == current_user.id,
            Result.test_id == test_id,
        ).order_by(desc(Result.completed_at)).limit(1)
    )
    res = row.scalar_one_or_none()
    if not res:
        raise HTTPException(status_code=404, detail="Result not found")
    test_r = await db.execute(select(Test).where(Test.id == test_id))
    test = test_r.scalar_one_or_none()
    return {
        "result": _result_out(res).model_dump(),
        "test": {
            "id": test.id if test else test_id,
            "title": test.title if test else "",
            "passing_score": test.passing_score if test else 60,
            "show_answers_after": test.show_answers_after if test else True,
        } if test else None,
    }


@router.get("/{result_id}", response_model=ResultOut)
async def get_result(result_id: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Result).where(Result.id == result_id))
    res = result.scalar_one_or_none()
    if not res:
        raise HTTPException(status_code=404, detail="Result not found")
    if res.user_id != current_user.id and current_user.role not in ("teacher", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized")
    return _result_out(res)
