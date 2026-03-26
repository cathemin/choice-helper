// 前端：读取输入 -> 调用后端 /api/decide -> 展示三张卡片
document.addEventListener("DOMContentLoaded", () => {
  const tryBtn = document.getElementById("tryBtn");
  const confusionInput = document.getElementById("confusionInput");
  const status = document.getElementById("status");
  const resultArea = document.getElementById("resultArea");
  const option1Label = document.getElementById("option1Label");
  const option2Label = document.getElementById("option2Label");
  const reasonA = document.getElementById("reasonA");
  const reasonB = document.getElementById("reasonB");
  const leaning = document.getElementById("leaning");

  if (
    !tryBtn ||
    !confusionInput ||
    !status ||
    !resultArea ||
    !option1Label ||
    !option2Label ||
    !reasonA ||
    !reasonB ||
    !leaning
  )
    return;

  const originalText = tryBtn.textContent;
  const loadingText = "让小猫想想…";

  const setLoading = (isLoading) => {
    tryBtn.disabled = isLoading;
    tryBtn.textContent = isLoading ? loadingText : originalText;
  };

  tryBtn.addEventListener("click", async () => {
    const question = confusionInput.value.trim();

    if (!question) {
      status.textContent = "先告诉小猫你在纠结什么吧。";
      resultArea.hidden = true;
      return;
    }

    status.textContent = "";
    setLoading(true);

    try {
      const resp = await fetch("/api/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const data = await resp.json();

      if (!data || typeof data !== "object" || typeof data.mode !== "string") {
        throw new Error("Invalid response shape");
      }

      if (data.mode === "decision") {
        if (typeof data.option1 !== "string" || typeof data.option2 !== "string") {
          throw new Error("Invalid decision response: missing option1/option2");
        }
        if (typeof data.reasonA !== "string" || typeof data.reasonB !== "string" || typeof data.leaning !== "string") {
          throw new Error("Invalid decision response: missing reasonA/reasonB/leaning");
        }

        status.textContent = "";
        option1Label.textContent = data.option1;
        option2Label.textContent = data.option2;
        reasonA.textContent = data.reasonA;
        reasonB.textContent = data.reasonB;
        leaning.textContent = data.leaning;
        resultArea.hidden = false;
      } else {
        resultArea.hidden = true;
        option1Label.textContent = "";
        option2Label.textContent = "";
        reasonA.textContent = "";
        reasonB.textContent = "";
        leaning.textContent = "";
        status.textContent = typeof data.message === "string" && data.message ? data.message : "小猫没接住你的话，再试一次吧。";
      }
    } catch (e) {
      resultArea.hidden = true;
      status.textContent = "小猫刚刚走神了，再试一次吧。";
    } finally {
      setLoading(false);
    }
  });
});
