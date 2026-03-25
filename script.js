// 等 DOM 加载完成后再绑定事件，避免元素尚未出现
document.addEventListener("DOMContentLoaded", () => {
  const tryBtn = document.getElementById("tryBtn");
  const confusionInput = document.getElementById("confusionInput");
  const result = document.getElementById("result");

  if (!tryBtn || !confusionInput || !result) return;

  tryBtn.addEventListener("click", () => {
    const text = confusionInput.value.trim();

    if (!text) {
      result.textContent = "先写点内容吧";
      result.classList.remove("card");
      return;
    }

    result.textContent = text;
    result.classList.add("card");
  });
});
