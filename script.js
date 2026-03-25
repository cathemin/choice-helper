// 等 DOM 加载完成后再绑定事件，避免元素尚未出现
document.addEventListener("DOMContentLoaded", () => {
  const tryBtn = document.getElementById("tryBtn");
  const confusionInput = document.getElementById("confusionInput");
  const status = document.getElementById("status");
  const resultArea = document.getElementById("resultArea");
  const reasonA = document.getElementById("reasonA");
  const reasonB = document.getElementById("reasonB");
  const preference = document.getElementById("preference");

  if (!tryBtn || !confusionInput || !status || !resultArea || !reasonA || !reasonB || !preference)
    return;

  tryBtn.addEventListener("click", () => {
    const text = confusionInput.value.trim();

    if (!text) {
      status.textContent = "先写点内容吧";
      resultArea.hidden = true;
      return;
    }

    status.textContent = "";
    resultArea.hidden = false;

    // 本地模拟逻辑（不接入任何 AI API）
    const normalized = text.toUpperCase();
    const hasWantNo = text.includes("要不要");

    // 尽量避免把普通单词里的 A/B 当成选项；仅在“边界”附近出现时算作明确 A/B
    const hasA = /(^|[^A-Z0-9])A([^A-Z0-9]|$)/.test(normalized);
    const hasB = /(^|[^A-Z0-9])B([^A-Z0-9]|$)/.test(normalized);

    const useAB = hasA || hasB;

    if (useAB) {
      reasonA.textContent = hasA
        ? "如果你把注意力放在 A，它可能更稳妥一些，也更容易立刻开始。"
        : "如果你更偏向 A，它也许会让你少一点顾虑，推进会更顺一点。";

      reasonB.textContent = hasB
        ? "如果你也在想 B，它可能更有新鲜感，但不确定性会更高一点。"
        : "如果你改成 B，你可能会更激动一些，只是结果不一定完全可预期。";

      if (hasWantNo) {
        preference.textContent = (() => {
          if (hasA && !hasB) return "“要不要”的感觉很明确：我会先轻轻推你向 A；B 先当备选就好。";
          if (!hasA && hasB) return "“要不要”的拉扯也很真实：我会先轻轻推你向 B；A 就留作稳妥备选。";
          return "你这段里 A 和 B 都在打架：要不要就先选 A 当起步？你随时都能再调整方向。";
        })();
      } else {
        preference.textContent = (() => {
          if (hasA && !hasB) return "如果一定要我轻轻推你一下，我会更偏向 A；相对 B 更省心一点。";
          if (!hasA && hasB) return "如果一定要我轻轻推你一下，我会更偏向 B；相对 A 更有行动感一点。";
          return "如果一定要我轻轻推你一下，我会稍微偏向 A；B 作为第二步也不会亏。";
        })();
      }
    } else {
      // 未明确 A/B：用“当前这个选择”和“另一种可能”
      reasonA.textContent =
        "如果你把“当前这个选择”当作先手，它可能更稳一点，也更容易让你立刻开始。";
      reasonB.textContent =
        "如果你选择“另一种可能”，也许会更有新鲜感，但不确定性可能会更高一点。";

      if (hasWantNo) {
        preference.textContent =
          "“要不要”听起来你其实想要一个更好下台阶的答案：我会轻轻推你先选“当前这个选择”，给自己一个开始的机会。";
      } else {
        preference.textContent =
          "如果一定要我轻轻推你一下，我会稍微偏向“当前这个选择”；不行的话再换也来得及。";
      }
    }
  });
});
