export function formatPrice(n) {
  return new Intl.NumberFormat("ru-RU").format(n) + " ₽";
}

export const TYPE_LABEL = {
  apartment: "Квартира",
  house: "Дом",
  commercial: "Коммерция",
};

export const STATUS_LABEL = {
  active: "В продаже",
  sold: "Продано",
  rented: "Сдано",
};

document.addEventListener("DOMContentLoaded", () => {
  const burger = document.querySelector(".burger");
  const nav = document.querySelector(".nav");
  if (burger && nav) {
    burger.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      burger.setAttribute("aria-expanded", String(open));
      burger.textContent = open ? "✕" : "☰";
    });
    nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
      nav.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
      burger.textContent = "☰";
    }));
  }
});
