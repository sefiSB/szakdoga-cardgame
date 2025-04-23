export let initialState = {
  user: JSON.parse(localStorage.getItem("user")) || null,
  user_id: parseInt(JSON.parse(localStorage.getItem("user_id"))) || null,
  code: parseInt(JSON.parse(localStorage.getItem("code"))) || null,
  temp_id: JSON.parse(localStorage.getItem("temp_id"))||null,
};

export function setItem(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function removeItem(key) {
  localStorage.removeItem(key);
}