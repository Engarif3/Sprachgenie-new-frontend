export const modifyPayload = (formDataInput) => {
  const obj = { ...formDataInput };
  const data = JSON.stringify(obj);
  const formData = new FormData();
  formData.append("data", data);
  return formData;
};
