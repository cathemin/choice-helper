// 等 DOM 加载完成后再绑定事件，避免元素尚未出现
document.addEventListener("DOMContentLoaded", () => {
  const tryBtn = document.getElementById("tryBtn");
  const result = document.getElementById("result");

  if (!tryBtn || !result) return;

  tryBtn.addEventListener("click", () => {
    result.textContent = "项目运行成功了";
  });
});
