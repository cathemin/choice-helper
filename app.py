import json
import os
import re

from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory

try:
    from openai import OpenAI
except ImportError as e:
    raise RuntimeError(
        "Missing dependency 'openai'. Please install dependencies with: pip install -r requirements.txt"
    ) from e

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))


def env_bool(name: str, default: bool = True) -> bool:
    val = os.getenv(name)
    if val is None:
        return default
    return val.strip().lower() in {"1", "true", "yes", "y", "on"}


MOCK_MODE = env_bool("MOCK_MODE", True)
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "").strip()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip()
PORT = int(os.getenv("PORT", "5000"))
DEBUG = env_bool("DEBUG", False)

app = Flask(__name__)

# 按你的要求初始化（DeepSeek OpenAI 兼容）
client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY") or "",
    base_url="https://api.deepseek.com",
)

# 备用：有些兼容实现 base_url 可能需要显式包含 /v1
client_v1 = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY") or "",
    base_url="https://api.deepseek.com/v1",
)

def has_standalone_option(question: str, option: str) -> bool:
    """
    判断文本里是否出现“独立的 A/B 选项”。
    用非字母数字边界来做一个轻量的启发式，避免把普通单词里的 A/B误判成选项。
    """
    if not question:
        return False
    pattern = rf"(^|[^A-Za-z0-9]){re.escape(option)}([^A-Za-z0-9]|$)"
    return re.search(pattern, question.upper()) is not None


def mock_decide(question: str) -> dict:
    q = question.strip()
    want_no = "要不要" in q
    hasA = has_standalone_option(q, "A")
    hasB = has_standalone_option(q, "B")

    # 若用户没有明确 A/B：把 reasonA 视为“当前这个选择”，reasonB 视为“另一种可能”
    if not hasA and not hasB:
        reasonA = (
            "这一边更像是在给自己一个立刻能动的台阶：先推进一点，心就不会一直悬着。"
            if want_no
            else "当前这个选择如果先迈出去，往往更容易让你把不确定变成可操作的下一步。"
        )
        reasonB = "另一种可能也许更带劲，但要承受的未知会多一点；你可能需要更耐心地试探。"
        leaning = (
            "“要不要”这句里其实有点想要安心：我会先轻轻推你向当前这个选择，给自己一个开始的理由。"
            if want_no
            else "如果要我用尾巴尖轻轻点一下，我会稍微偏向当前这个选择：先试一小步，走不通再调整。"
        )
        return {"reasonA": reasonA, "reasonB": reasonB, "leaning": leaning}

    # 有明确 A/B：A -> 这边，B -> 那边（前端卡片也是一一对应）
    if hasA:
        reasonA = (
            "A 这一边更像是“现在就能落地”的选项：稳妥一点，也更容易立刻开始。"
            if want_no
            else "如果你把注意力放在 A，这边更稳一点，也更容易立刻进入行动。"
        )
    else:
        reasonA = "A 这边也有价值，只是你可能还需要一点勇气把它兑现。"

    if hasB:
        reasonB = (
            "如果你更偏向 B，那边也许更有新鲜感，但不确定性会更高一点，你得接受一点波动。"
            if want_no
            else "B 这边更刺激一点：可能更有新鲜感，但也更容易有你没预料到的波澜。"
        )
    else:
        reasonB = "B 也不是坏选项，只是你可能会更容易反复琢磨。"

    # “要不要”时语气更像建议：轻微偏向，不命令
    if want_no:
        if hasA and not hasB:
            leaning = "“要不要”的心情很清楚了：我会先轻轻推你向 A；B 就当作后续再看看。"
        elif not hasA and hasB:
            leaning = "“要不要”这句也挺真实：我会先轻轻推你向 B；A 就留作稳妥备选。"
        else:
            leaning = "你在 A 和 B 之间拉扯很正常：我会稍微偏向 A，给你先把事情推起来的机会。"
    else:
        if hasA:
            leaning = "如果你已经更靠近 A，那就继续向前：我会偏向 A，让起步更顺一些。"
        else:
            leaning = "既然你更靠近 B，我会稍微偏向 B：先把热度用起来，再慢慢调整。"

    return {"reasonA": reasonA, "reasonB": reasonB, "leaning": leaning}


def detect_mode(question: str) -> dict:
    """
    输入判断（本地启发式），产出产品的 4 种模式。
    非 decision 时不会返回 reasonA/reasonB/leaning，只返回 message。
    """
    q = (question or "").strip()
    if not q:
        return {"mode": "unclear", "message": "小猫还没太看懂你在两种什么之间纠结呢。可以再说得具体一点吗？"}

    want_no = "要不要" in q or "要不" in q
    hasA = has_standalone_option(q, "A")
    hasB = has_standalone_option(q, "B")
    hasC = has_standalone_option(q, "C")
    hasD = has_standalone_option(q, "D")
    hasE = has_standalone_option(q, "E")

    option_letters = [x for x in ["A", "B", "C", "D", "E"] if has_standalone_option(q, x)]
    has_compare = any(word in q for word in ["还是", "或", "或者", "VS", "vs"])
    count_ri = q.count("还是")
    # 用正则匹配，避免“或者”里包含“或”导致重复计数
    count_or = len(re.findall(r"(?:或者|或)", q))
    separator_count = count_ri + count_or

    too_many_msg = "“选项有点多，小猫有点转不过来啦…你可以先告诉我两个你最在意的选项吗？”"
    too_few_msg = "“小猫好像只看到一个方向呢。你可以再想想，有没有另一个你在犹豫的选项？”"
    unclear_msg = "“小猫还没太看懂你在两种什么之间纠结呢。可以再说得具体一点吗？”"

    # 先判断 too_many：多个“还是/或”或明确出现三种及以上选项字母
    if separator_count >= 2 or len(option_letters) >= 3:
        return {"mode": "too_many", "message": too_many_msg}

    # decision：明确看到 A 和 B 两边
    if hasA and hasB:
        return {"mode": "decision"}

    # 若出现对比词，但没能清晰识别出 A/B，归为 unclear
    if has_compare:
        return {"mode": "unclear", "message": unclear_msg}

    # 没有对比词：有 A 或 B 的单边情况 -> too_few；否则再根据语境决定 too_few/unclear
    if hasA or hasB:
        return {"mode": "too_few", "message": too_few_msg}

    if want_no or any(k in q for k in ["继续", "开始", "就", "再", "保留", "做不做", "要不要继续"]):
        return {"mode": "too_few", "message": too_few_msg}

    return {"mode": "unclear", "message": unclear_msg}


def build_deepseek_system_prompt() -> str:
    # 按你的要求：由 AI 自己判断输入是否构成二选一，并返回 mode=decision/invalid。
    return (
        "你是一只安静、聪明、温和的小猫顾问。\n"
        "你的任务是在用户犹豫时帮ta做出选择。\n"
        "你会先判断用户的问题是否构成一个清晰的二选一。\n\n"
        "语气要求：\n"
        "- 温和、自然、克制\n"
        "- 可以有一点小猫的感觉，萌中带点傲娇\n"
        "- 可以在句子中偶尔加入一些“喵”\n"
        "- 你是一只小猫，语气是淡淡的萌感\n"
        '- 你自称“小猫”，不要出现“我”\n'
        "- 不要幼稚，不要过度卖萌\n"
        "- 不要说教\n"
        "- 不要使用“综合来看”“建议你选择”“你应该”\n\n"
        "判断标准（由你完成，不要让程序用关键词/规则判断）：\n"
        "1) 如果用户输入中可以明确提取出两个方向，即使不是标准“还是/or/要不要”句式，也可以视为有效二选一。\n"
        "   例如：上厕所 or 洗澡、可不可以现在去洗澡、要不要继续这个项目、学不学日语、去不去那个活动。\n"
        "2) 如果输入包含太多选项，无法自然压缩成两个选项，则返回无效：invalidType=too_many。\n"
        "3) 如果只有一个模糊方向，没有明显对立面，则返回无效：invalidType=too_few。\n"
        "4) 如果表达太模糊，看不出具体在选什么，则返回无效：invalidType=unclear。\n\n"
        "输出要求：\n"
        "必须严格返回 JSON，不要有任何额外文本。\n\n"
        "当有效二选一时，返回：\n"
        "{\n"
        '  "mode": "decision",\n'
        '  "option1": "选项1",\n'
        '  "option2": "选项2",\n'
        '  "reasonA": "这一边的理由",\n'
        '  "reasonB": "另一边的理由",\n'
        '  "leaning": "小猫的轻微倾向"\n'
        "}\n\n"
        "当无效时，返回：\n"
        "{\n"
        '  "mode": "invalid",\n'
        '  "invalidType": "too_many" 或 "too_few" 或 "unclear",\n'
        '  "message": "给用户看的小猫提示文案"\n'
        "}\n\n"
        "无效时 message 文案规则（必须使用以下风格文案，按 invalidType 选择对应内容）：\n"
        'too_many：\n'
        "“选项有点多，小猫有点转不过来啦…你可以先告诉我两个你最在意的选项吗？”\n"
        'too_few：\n'
        "“小猫好像只看到一个方向呢。你可以再想想，有没有另一个你在犹豫的选项？”\n"
        'unclear：\n'
        "“小猫还没太看懂你在两种什么之间纠结呢。可以再说得具体一点吗？”\n"
    )


def decide_with_deepseek(question: str) -> dict:
    if not DEEPSEEK_API_KEY:
        raise RuntimeError("DEEPSEEK_API_KEY is missing.")

    system_prompt = build_deepseek_system_prompt()
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": question},
    ]

    def parse_json_from_content(content: str) -> dict:
        content = (content or "").strip()
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            # 有些兼容实现可能不会严格返回 JSON；尝试从文本中提取第一个 JSON 对象
            m = re.search(r"\{.*\}", content, flags=re.S)
            if not m:
                raise
            return json.loads(m.group(0))

    # openai 兼容接口调用 DeepSeek（先尝试 response_format，失败则回退）
    last_error = None
    for use_response_format in (True, False):
        try:
            if use_response_format:
                try:
                    resp = client.chat.completions.create(
                        model="deepseek-chat",
                        messages=messages,
                        response_format={"type": "json_object"},
                    )
                except Exception:
                    # 备用 base_url 兼容
                    resp = client_v1.chat.completions.create(
                        model="deepseek-chat",
                        messages=messages,
                        response_format={"type": "json_object"},
                    )
            else:
                try:
                    resp = client.chat.completions.create(
                        model="deepseek-chat",
                        messages=messages,
                    )
                except Exception:
                    resp = client_v1.chat.completions.create(
                        model="deepseek-chat",
                        messages=messages,
                    )

            content = resp.choices[0].message.content or ""
            parsed = parse_json_from_content(content)

            if not isinstance(parsed, dict) or "mode" not in parsed or not isinstance(parsed["mode"], str):
                raise ValueError("AI output is not a valid JSON object with a string mode.")

            mode = parsed["mode"]
            if mode == "decision":
                for key in ("option1", "option2", "reasonA", "reasonB", "leaning"):
                    if key not in parsed or not isinstance(parsed[key], str):
                        raise ValueError("AI decision output missing required keys or wrong types.")
                return parsed

            if mode == "invalid":
                if "invalidType" not in parsed or not isinstance(parsed["invalidType"], str):
                    raise ValueError("AI invalid output missing invalidType.")
                if parsed["invalidType"] not in {"too_many", "too_few", "unclear"}:
                    raise ValueError("AI invalidType is not allowed.")
                if "message" not in parsed or not isinstance(parsed["message"], str):
                    raise ValueError("AI invalid output missing message.")
                return parsed

            raise ValueError("AI output mode must be decision or invalid.")
        except Exception as e:
            last_error = e

    raise RuntimeError(f"DeepSeek call failed: {last_error}")


@app.post("/api/decide")
def api_decide():
    body = request.get_json(silent=True) or {}
    question = body.get("question", "")
    if not isinstance(question, str) or not question.strip():
        return jsonify({"error": "question is required"}), 400

    question = question.strip()
    if not DEEPSEEK_API_KEY:
        return jsonify({"mode": "error", "message": "小猫刚刚走神了，再试一次吧。"})

    try:
        result = decide_with_deepseek(question)
        return jsonify(result)
    except Exception as e:
        err_msg = "小猫刚刚走神了，再试一次吧。"
        print(f"[api/decide] DeepSeek call failed: {e}")
        if DEBUG:
            return jsonify({"mode": "error", "message": err_msg, "debug": str(e)})
        return jsonify({"mode": "error", "message": err_msg})


@app.get("/")
def index():
    return send_from_directory(BASE_DIR, "index.html")


@app.get("/style.css")
def style_css():
    return send_from_directory(BASE_DIR, "style.css")


@app.get("/script.js")
def script_js():
    return send_from_directory(BASE_DIR, "script.js")


# 兼容你之前的旧命名（如果还没完全切过去）
@app.get("/styles.css")
def styles_css():
    return send_from_directory(BASE_DIR, "styles.css")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=DEBUG)

