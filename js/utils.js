export const qs = (sel, parent = document) => parent.querySelector(sel);

export const qsa = (sel, parent = document) =>
  Array.from(parent.querySelectorAll(sel));

export const debounce = (fn, delay = 300) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
};

export const getParam = (name) =>
  new URLSearchParams(window.location.search).get(name);
