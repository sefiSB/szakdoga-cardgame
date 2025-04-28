export let initialState = {
  user: JSON.parse(sessionStorage.getItem("user")) || null,
  user_id: parseInt(JSON.parse(sessionStorage.getItem("user_id"))) || null,
  code: parseInt(JSON.parse(sessionStorage.getItem("code"))) || null,
  temp_id: JSON.parse(sessionStorage.getItem("temp_id"))||null,
  expiration: JSON.parse(sessionStorage.getItem("expiration")) || null,
};


export function setItem(key, value) {
  sessionStorage.setItem(key, JSON.stringify(value));
}

export function removeItem(key) {
  sessionStorage.removeItem(key);
}