const form = document.getElementById('uploadForm');
const input = document.getElementById('upload');

input.addEventListener('change', () => {
  if (input.files.length) form.requestSubmit();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const response = await fetch(form.action, {
    method: 'POST',
    body: new FormData(form),
  });

  const result = await response.json();
  console.log(result);

  form.reset(); // lets the same file be picked again
});
